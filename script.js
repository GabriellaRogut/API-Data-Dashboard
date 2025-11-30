document.addEventListener("DOMContentLoaded", () => {

    // -------------------------
    // ELEMENTS
    // -------------------------
    const loadBtn = document.getElementById("loadDataBtn");
    const addBtn = document.getElementById("addDataBtn");
    const downloadPdfBtn = document.getElementById("downloadPdfBtn");

    const tableBody = document.querySelector(".info-table tbody");
    const totalProductsBadge = document.getElementById("total-products");
    const activeCallsBadge = document.getElementById("active-calls");
    const errorsBadge = document.getElementById("errors-today");

    let errorsCount = 0;

    // Success message box
    const msgBox = document.getElementById("message-box");
    const msgClose = document.getElementById("MessageClose");
    msgClose.addEventListener("click", () => (msgBox.style.display = "none"));


    // -------------------------
    // BADGE UPDATES
    // -------------------------
    function updateBadges() {
        totalProductsBadge.textContent = "Total Products: " + tableBody.rows.length;
        errorsBadge.textContent = "Errors Today: " + errorsCount;
    }

    function setActiveCalls(num) {
        activeCallsBadge.textContent = "Active API Calls: " + num;
    }

    function showSuccess(message) {
        // Show a temporary success message
        msgBox.style.display = "block";
        msgBox.querySelector(".mssg").innerHTML = 
            `<span style="color:green;">&#10004;</span> ${message}`;

        setTimeout(() => {
            msgBox.classList.add("slide-out");
            setTimeout(() => {
                msgBox.classList.remove("slide-out");
                msgBox.style.display = "none";
            }, 600);
        }, 2000);
    }


    // -------------------------
    // LOAD PRODUCTS
    // -------------------------
    loadBtn.addEventListener("click", () => {
        setActiveCalls(1); // Indicate an API call is in progress

        // Fetch product list from API
        fetch("https://api.escuelajs.co/api/v1/products")
            .then(res => res.json()) // Convert response to JSON
            .then(products => {
                tableBody.innerHTML = ""; // Clear previous rows

                // Add each product to the table
                products.forEach(p => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${p.id}</td>
                        <td><img src="${p.images?.[0] || ""}" alt="${p.title}"></td>
                        <td>${p.title}</td>
                        <td>$${p.price}</td>
                        <td>${p.category?.name || ""}</td>
                        <td>${p.description}</td>
                        <td>
                            <div class="table-actions">
                                <button class="btn-del"><i class="fa-solid fa-trash"></i> Delete</button>
                                <button class="btn-upd"><i class="fa-solid fa-file-pen"></i> Update</button>
                            </div>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });

                updateBadges(); // Update totals and errors
            })
            .catch(err => {
                console.error("Error loading products", err);
                errorsCount++; // Increase error count if fetch fails
                updateBadges();
            })
            .finally(() => setActiveCalls(0)); // End of API call
    });


    // -------------------------
    // DELETE PRODUCT
    // -------------------------
    const deleteModal = document.getElementById("deleteModal");
    const btnDeleteYes = deleteModal.querySelector(".btn-yes");
    const btnDeleteNo = deleteModal.querySelector(".btn-no");
    const btnDeleteClose = deleteModal.querySelector(".close");

    let rowToDelete = null;

    // Open delete modal
    tableBody.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-del");
        if (!btn) return;

        rowToDelete = btn.closest("tr"); // Save which row to delete
        deleteModal.style.display = "flex";
    });

    btnDeleteNo.onclick = closeDeleteModal;
    btnDeleteClose.onclick = closeDeleteModal;

    function closeDeleteModal() {
        deleteModal.style.display = "none";
        rowToDelete = null;
    }

    // Confirm delete
    btnDeleteYes.addEventListener("click", () => {
        if (!rowToDelete) return;

        const id = rowToDelete.cells[0].innerText; // Get product ID
        setActiveCalls(1);

        // Send DELETE request to API
        fetch(`https://api.escuelajs.co/api/v1/products/${id}`, { method: "DELETE" })
            .then(() => {
                rowToDelete.remove(); // Remove row from table
                showSuccess("Item Deleted Successfully.");
                updateBadges();
                closeDeleteModal();
            })
            .catch(err => {
                console.error("Delete failed:", err);
                errorsCount++;
                updateBadges();
            })
            .finally(() => setActiveCalls(0));
    });


    // -------------------------
    // UPDATE PRODUCT
    // -------------------------
    const updateModal = document.getElementById("updateModal");
    const updateForm = document.getElementById("updateForm");
    const updateClose = updateModal.querySelector(".close");
    const updateError = updateForm.querySelector(".error-msg");
    const updateSpinner = updateForm.querySelector(".spinner");
    const updateCategorySelect = document.getElementById("updateCategorySelect");

    let currentRow = null;
    let currentProductId = null;

    // Load category options for dropdowns
    fetch("https://api.escuelajs.co/api/v1/categories")
        .then(res => res.json())
        .then(categories => {
            categories.forEach(cat => {
                updateCategorySelect.innerHTML += 
                    `<option value="${cat.id}">${cat.name}</option>`;
                addCategorySelect.innerHTML +=
                    `<option value="${cat.id}">${cat.name}</option>`;
            });
        });

    // Open update modal with current row's data
    tableBody.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-upd");
        if (!btn) return;

        currentRow = btn.closest("tr");
        currentProductId = currentRow.cells[0].innerText;

        // Fill form with existing data
        updateForm.title.value = currentRow.cells[2].innerText;
        updateForm.price.value = currentRow.cells[3].innerText.replace("$", "");
        updateForm.description.value = currentRow.cells[5].innerText;
        updateForm.image.value = currentRow.cells[1].querySelector("img").src;

        // Get the category name from the table row
        const categoryName = currentRow.cells[4].innerText;

        // Loop through all options in the select element
        for (let i = 0; i < updateCategorySelect.options.length; i++) {
            if (updateCategorySelect.options[i].text === categoryName) {
                updateCategorySelect.value = updateCategorySelect.options[i].value;
                break;
            }
        }
        updateModal.style.display = "flex";
    });

    updateClose.onclick = () => {
        updateModal.style.display = "none";
        updateError.style.display = "none";
    };

    // Submit updated product
    updateForm.addEventListener("submit", (e) => {
        e.preventDefault(); // Prevent the default form submission (page reload)

        // Get values from the form fields
        const title = updateForm.title.value.trim();
        const price = parseFloat(updateForm.price.value);
        const description = updateForm.description.value.trim();
        const image = updateForm.image.value.trim();
        const categoryId = parseInt(updateCategorySelect.value);
        const categoryText = updateCategorySelect.options[updateCategorySelect.selectedIndex].text;

        if (!title || !image || !description || price <= 0) {
            updateError.textContent = "Please fill all fields correctly.";
            updateError.style.display = "block";
            return;
        }

        updateError.style.display = "none";
        updateSpinner.style.display = "inline-block";
        setActiveCalls(1);

        // Send PUT request to update product
        fetch(`https://api.escuelajs.co/api/v1/products/${currentProductId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" }, // Tell server we're sending JSON
            body: JSON.stringify({  // Convert product data to JSON string
                title, 
                price, 
                description,
                category: { id: categoryId },
                images: [image]
            })
        })
        .then(res => res.json())  // Convert response from API to JavaScript object
        .then(updated => {
            // Update table
            currentRow.cells[1].querySelector("img").src = updated.images[0]; 
            currentRow.cells[2].innerText = updated.title;
            currentRow.cells[3].innerText = "$" + updated.price;
            currentRow.cells[4].innerText = categoryText;
            currentRow.cells[5].innerText = updated.description;

            updateModal.style.display = "none";
            updateBadges();
            showSuccess("Item Updated Successfully.");
        })
        .catch(() => {
            updateError.innerHTML = "&#9888; Error updating product.";
            updateError.style.display = "block";
        })
        .finally(() => {
            updateSpinner.style.display = "none";
            setActiveCalls(0);
        });
    });


    // -------------------------
    // ADD PRODUCT
    // -------------------------
    const addModal = document.getElementById("addModal");
    const addForm = document.getElementById("addForm");
    const addClose = document.getElementById("addClose");
    const addError = addForm.querySelector(".error-msg");
    const addSpinner = addForm.querySelector(".spinner");
    const addCategorySelect = document.getElementById("addCategorySelect");

    // Open add modal
    addBtn.onclick = () => {
        addForm.reset();
        addModal.style.display = "flex";
        addError.style.display = "none";
    };

    addClose.onclick = () => {
        addModal.style.display = "none";
        addError.style.display = "none";
    };

    // Submit new product
    addForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const title = addForm.title.value.trim();
        const price = parseFloat(addForm.price.value);
        const description = addForm.description.value.trim();
        const image = addForm.image.value.trim();
        const categoryId = parseInt(addCategorySelect.value);
        const categoryText = addCategorySelect.options[addCategorySelect.selectedIndex].text;

        if (!title || !image || !description || price <= 0) {
            addError.textContent = "Please fill all fields correctly.";
            addError.style.display = "block";
            return;
        }

        addSpinner.style.display = "inline-block";
        setActiveCalls(1);

        // Send POST request to add product
        fetch("https://api.escuelajs.co/api/v1/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title, 
                price, 
                description,
                categoryId, 
                images: [image]
            })
        })
            .then(res => res.json())
            .then(newProduct => {
                // Add new product row to table
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${newProduct.id}</td>
                    <td><img src="${newProduct.images?.[0] || ""}" alt=""></td>
                    <td>${newProduct.title}</td>
                    <td>$${newProduct.price}</td>
                    <td>${categoryText}</td>
                    <td>${newProduct.description}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-del">Delete</button>
                            <button class="btn-upd">Update</button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);

                addModal.style.display = "none";
                updateBadges();
                showSuccess("Item Added Successfully.");
            })
            .catch(() => {
                addError.innerHTML = "&#9888; Error adding product.";
                addError.style.display = "block";
                errorsCount++;
            })
            .finally(() => {
                addSpinner.style.display = "none";
                setActiveCalls(0);
            });
    });


    // -------------------------
    // DOWNLOAD PDF
    // -------------------------
    downloadPdfBtn.addEventListener("click", () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const headers = [...document.querySelectorAll(".info-table th")].map(th => th.innerText);
        const rows = [...document.querySelectorAll(".info-table tbody tr")]
            .map(tr => [...tr.cells].map(td => td.innerText));

        doc.autoTable({
            head: [headers],
            body: rows,
            startY: 10,
            styles: { fontSize: 8 }
        });

        doc.save("products.pdf");
    });

});
