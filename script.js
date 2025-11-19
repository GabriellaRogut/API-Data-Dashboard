document.addEventListener("DOMContentLoaded", function() {

    var loadBtn = document.querySelector(".actions-container button:first-child");
    var tableBody = document.querySelector(".info-table tbody");

    var totalProductsBadge = document.getElementById("total-products");
    var activeCallsBadge = document.getElementById("active-calls");
    var errorsBadge = document.getElementById("errors-today");

    var errorsCount = 0;


    // ======= UPDATE BADGES =======
    function updateBadges() {
        totalProductsBadge.textContent = "Total Products: " + tableBody.rows.length;
        errorsBadge.textContent = "Errors Today: " + errorsCount;
    }


    // ======= CLOSE MESSAGE =======
    var messageBox = document.getElementById("message-box");
    var messageClose = document.getElementById("MessageClose");

    messageClose.addEventListener("click", function () {
        messageBox.style.display = "none";
    });


    // ======= LOAD PRODUCTS =======
    loadBtn.addEventListener("click", function() {
        activeCallsBadge.textContent = "Active API Calls: 1";

        fetch("https://api.escuelajs.co/api/v1/products")
        .then(function(res) {
            return res.json();
        })
        .then(function(products) {
            tableBody.innerHTML = "";

            for (var i = 0; i < products.length; i++) {
                var p = products[i];
                var tr = document.createElement("tr");
                var image = "";

                if (p.images && p.images.length > 0) {
                    image = p.images[0];
                }

                tr.innerHTML = `
                    <td>${p.id}</td>
                    <td><img src="${image}" alt="${p.title}"></td>
                    <td>${p.title}</td>
                    <td>$${p.price}</td>
                    <td>${p.category && p.category.name ? p.category.name : ""}</td>
                    <td>${p.description}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-del"><i class="fa-solid fa-trash"></i> Delete</button>
                            <button class="btn-upd"><i class="fa-solid fa-file-pen"></i> Update</button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
            }

            activeCallsBadge.textContent = "Active API Calls: 0";
            updateBadges();
        })
        .catch(function(err) {
            console.log("Error loading data:", err);
            errorsCount++;
            activeCallsBadge.textContent = "Active API Calls: 0";
            updateBadges();
        });
    });


    // ======= DELETE PRODUCT =======
    var deleteModal = document.getElementById("deleteModal");
    var btnYes = deleteModal.querySelector(".btn-yes");
    var btnNo = deleteModal.querySelector(".btn-no");
    var closeBtn = deleteModal.querySelector(".close");
    var mssgSuccess = document.getElementById("message-box");

    var rowToDelete = null;

    tableBody.addEventListener("click", function(e) {
        const btn = e.target.closest(".btn-del");
        if (btn) {
            rowToDelete = btn.closest("tr");
            deleteModal.style.display = "flex";
        }
    });


    btnYes.addEventListener("click", function() {
        if (!rowToDelete) return;

        var productId = rowToDelete.cells[0].innerText;
        activeCallsBadge.textContent = "Active API Calls: 1";

        fetch("https://api.escuelajs.co/api/v1/products/" + productId, {
            method: "DELETE"
        })
        .then(function() {
            rowToDelete.remove();
            deleteModal.style.display = "none";
            rowToDelete = null;
            updateBadges();

            mssgSuccess.style.display = "block";
            mssgSuccess.querySelector(".mssg").innerHTML = "<span style='color: rgb(135, 177, 135);'>&#10004;</span> Item Deleted Successfully.";

            setTimeout(() => {
                mssgSuccess.classList.add("slide-out");

                setTimeout(() => {
                    mssgSuccess.style.display = "none";
                    mssgSuccess.classList.remove("slide-out");
                }, 600);

            }, 2000);

        })
        .catch(function(err) {
            console.log("Delete failed:", err);
            errorsCount++;
            updateBadges();
        })
        .finally(function() {
            activeCallsBadge.textContent = "Active API Calls: 0";
        });
    });


    btnNo.addEventListener("click", function() {
        deleteModal.style.display = "none";
        rowToDelete = null;
    });

    closeBtn.addEventListener("click", function() {
        deleteModal.style.display = "none";
        rowToDelete = null;
    });

    window.addEventListener("click", function(e) {
        if (e.target === deleteModal) {
            deleteModal.style.display = "none";
            rowToDelete = null;
        }
    });

    
    // ======= UPDATE PRODUCT =======
    var updateModal = document.getElementById("updateModal");
    var updateForm = document.getElementById("updateForm");
    var updCloseBtn = updateModal.querySelector(".close");
    var errorMsg = updateForm.querySelector(".error-msg");
    var spinner = updateForm.querySelector(".spinner");
    var updateCategorySelect = document.getElementById("updateCategorySelect");

    var currentRow = null;
    var currentProductId = null;

    // ======= FETCH CATEGORIES & POPULATE SELECT =======
    var categoriesMap = {}; // { "clothes": 1, "electronics": 2, ... }

    fetch("https://api.escuelajs.co/api/v1/categories")
        .then(res => res.json())
        .then(categories => {
            categories.forEach(cat => {
                categoriesMap[cat.name.toLowerCase()] = cat.id;

                // update modal select
                var option = document.createElement("option");
                option.value = cat.id;
                option.textContent = cat.name;
                updateCategorySelect.appendChild(option);
            });
        })
        .catch(err => console.log("Error fetching categories:", err));

    // OPEN MODAL WITH PRODUCT DATA 
    tableBody.addEventListener("click", function(e) {
        const btn = e.target.closest(".btn-upd");
        if (btn) {
            currentRow = btn.closest("tr");
            currentProductId = currentRow.cells[0].innerText;

            updateForm.title.value = currentRow.cells[2].innerText;
            updateForm.price.value = parseFloat(currentRow.cells[3].innerText.replace("$", ""));
            updateForm.description.value = currentRow.cells[5].innerText;
            updateForm.image.value = currentRow.cells[1].querySelector("img").src;

            // Set selected category in dropdown
            var categoryName = currentRow.cells[4].innerText;
            for (var i = 0; i < updateCategorySelect.options.length; i++) {
                if (updateCategorySelect.options[i].text === categoryName) {
                    updateCategorySelect.selectedIndex = i;
                    break;
                }
            }

            updateModal.style.display = "flex";
        }
    });


    // close modal
    updCloseBtn.addEventListener("click", function() {
        updateModal.style.display = "none";
        errorMsg.style.display = "none";
    });

    window.addEventListener("click", function(e) {
        if (e.target === updateModal) {
            updateModal.style.display = "none";
            errorMsg.style.display = "none";
        }
    });

    // SUBMIT UPDATE
    updateForm.addEventListener("submit", function(e) {
        e.preventDefault();

        var title = updateForm.title.value.trim();
        var price = parseFloat(updateForm.price.value);
        var description = updateForm.description.value.trim();
        var image = updateForm.image.value.trim();
        var categoryId = parseInt(updateCategorySelect.value);
        var categoryName = updateCategorySelect.options[updateCategorySelect.selectedIndex].text;

        if (!title || !description || !image || isNaN(price) || price <= 0) {
            errorMsg.textContent = "Please fill all fields correctly.";
            errorMsg.style.display = "block";
            return;
        }

        spinner.style.display = "inline-block";
        errorMsg.style.display = "none";
        activeCallsBadge.textContent = "Active API Calls: 1";

        fetch(`https://api.escuelajs.co/api/v1/products/${currentProductId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: title,
                price: price,
                description: description,
                category: { id: categoryId },
                images: [image]
            })
        })
        .then(function(res) {
            if (!res.ok) throw new Error("Update failed");
            return res.json();
        })
        .then(function(updatedProduct) {
            // Update table row
            currentRow.cells[1].querySelector("img").src = updatedProduct.images[0] || "";
            currentRow.cells[2].innerText = updatedProduct.title;
            currentRow.cells[3].innerText = "$" + updatedProduct.price;
            currentRow.cells[4].innerText = categoryName;
            currentRow.cells[5].innerText = updatedProduct.description;

            updateModal.style.display = "none";
            updateBadges();

            mssgSuccess.style.display = "block";
            mssgSuccess.querySelector(".mssg").innerHTML = "<span style='color: rgb(135, 177, 135);'>&#10004;</span> Item Updated Successfully.";

            setTimeout(() => {
                mssgSuccess.classList.add("slide-out");
                setTimeout(() => {
                    mssgSuccess.style.display = "none";
                    mssgSuccess.classList.remove("slide-out");
                }, 600);
            }, 2000);
        })
        .catch(function(err) {
            console.log(err);
            errorsCount++;
            errorMsg.innerHTML = "&#9888; Error updating product. Please try again.";
            errorMsg.style.display = "block";
        })
        .finally(function() {
            spinner.style.display = "none";
            activeCallsBadge.textContent = "Active API Calls: 0";
            updateBadges();
        });
    });


    // ======= ADD PRODUCT =======
    var addBtn = document.querySelector(".actions-container button:nth-child(3)"); // Add Data button
    var addModal = document.getElementById("addModal");
    var addForm = document.getElementById("addForm");
    var addCloseBtn = document.getElementById("addClose");
    var addErrorMsg = addForm.querySelector(".error-msg");
    var addSpinner = addForm.querySelector(".spinner");
    var addCategorySelect = document.getElementById("addCategorySelect");

    // Populate Add Category Dropdown
    fetch("https://api.escuelajs.co/api/v1/categories")
        .then(res => res.json())
        .then(categories => {
            categories.forEach(cat => {
                var option = document.createElement("option");
                option.value = cat.id;
                option.textContent = cat.name;
                addCategorySelect.appendChild(option);
            });
        })
        .catch(err => console.log("Error fetching categories:", err));

    // ======= OPEN MODAL =======
    addBtn.addEventListener("click", function() {
        addForm.reset();
        addErrorMsg.style.display = "none";
        addModal.style.display = "flex";
    });

    // ======= CLOSE MODAL =======
    addCloseBtn.addEventListener("click", function() {
        addModal.style.display = "none";
        addErrorMsg.style.display = "none";
    });

    window.addEventListener("click", function(e) {
        if (e.target === addModal) {
            addModal.style.display = "none";
            addErrorMsg.style.display = "none";
        }
    });

    // ======= SUBMIT ADD FORM =======
    addForm.addEventListener("submit", function(e) {
        e.preventDefault();

        var title = addForm.title.value.trim();
        var price = parseFloat(addForm.price.value);
        var description = addForm.description.value.trim();
        var image = addForm.image.value.trim();
        var categoryId = parseInt(addCategorySelect.value);
        var categoryName = addCategorySelect.options[addCategorySelect.selectedIndex].text;

        if (!title || !description || !image || isNaN(price) || price <= 0) {
            addErrorMsg.textContent = "Please fill all fields correctly.";
            addErrorMsg.style.display = "block";
            return;
        }

        addSpinner.style.display = "inline-block";
        addErrorMsg.style.display = "none";
        activeCallsBadge.textContent = "Active API Calls: 1";

        fetch("https://api.escuelajs.co/api/v1/products/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: title,
                price: price,
                description: description,
                categoryId: categoryId,
                images: [image]
            })
        })
        .then(res => {
            if (!res.ok) throw new Error("Add product failed");
            return res.json();
        })
        .then(newProduct => {
            var tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${newProduct.id}</td>
                <td><img src="${newProduct.images[0] || ''}" alt="${newProduct.title}"></td>
                <td>${newProduct.title}</td>
                <td>$${newProduct.price}</td>
                <td>${categoryName}</td>
                <td>${newProduct.description}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-del"><i class="fa-solid fa-trash"></i> Delete</button>
                        <button class="btn-upd"><i class="fa-solid fa-file-pen"></i> Update</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);

            addModal.style.display = "none";
            updateBadges();

            mssgSuccess.style.display = "block";
            mssgSuccess.querySelector(".mssg").innerHTML = "<span style='color: rgb(135, 177, 135);'>&#10004;</span> Item Added Successfully.";

            setTimeout(() => {
                mssgSuccess.classList.add("slide-out");
                setTimeout(() => {
                    mssgSuccess.style.display = "none";
                    mssgSuccess.classList.remove("slide-out");
                }, 600);
            }, 2000);
        })
        .catch(err => {
            console.log(err);
            errorsCount++;
            addErrorMsg.innerHTML = "&#9888; Error adding product. Please try again.";
            addErrorMsg.style.display = "block";
            updateBadges();
        })
        .finally(() => {
            addSpinner.style.display = "none";
            activeCallsBadge.textContent = "Active API Calls: 0";
        });
    });



    // download pdf
    const downloadPdfBtn = document.getElementById("downloadPdfBtn");

    downloadPdfBtn.addEventListener("click", function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Gather table headers
        const headers = Array.from(document.querySelectorAll(".info-table th")).map(th => th.innerText);

        // Gather table rows
        const rows = Array.from(document.querySelectorAll(".info-table tbody tr")).map(tr => {
            return Array.from(tr.cells).map(td => td.innerText);
        });

        // Generate table in PDF
        doc.autoTable({
            head: [headers],
            body: rows,
            startY: 10,
            styles: { fontSize: 8 }
        });

        doc.save("products.pdf");
    });


});


