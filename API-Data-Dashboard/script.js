document.addEventListener("DOMContentLoaded", () => {
    const loadBtn = document.querySelector(".actions-container button:first-child");
    const tableBody = document.querySelector(".info-table tbody");

    const totalProductsBadge = document.querySelector("#total-products");
    const activeCallsBadge = document.querySelector("#active-calls");
    const errorsBadge = document.querySelector("#errors-today");

    let errorsCount = 0;

    const updateBadges = () => {
        totalProductsBadge.textContent = `Total Products: ${tableBody.rows.length}`;
        errorsBadge.textContent = `Errors Today: ${errorsCount}`;
    };

    
    // ===== LOAD PRODUCTS =====
    loadBtn.addEventListener("click", async () => {
        try {
            activeCallsBadge.textContent = "Active API Calls: 1";

            const res = await fetch("https://api.escuelajs.co/api/v1/products");
            const products = await res.json();

            tableBody.innerHTML = "";
            products.forEach(product => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${product.id}</td>
                    <td><img src="${product.images[0] || ''}" alt="${product.title}"></td>
                    <td>${product.title}</td>
                    <td>$${product.price}</td>
                    <td>${product.category?.name || ''}</td>
                    <td>${product.description}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-del">Delete</button>
                            <button class="btn-upd">Update</button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            updateBadges();
            activeCallsBadge.textContent = "Active API Calls: 0";
        } catch (err) {
            console.error("Error loading data:", err);
            errorsCount++;
            updateBadges();
            activeCallsBadge.textContent = "Active API Calls: 0";
        }
    });


    // ===== DELETE PRODUCT =====
    const deleteModal = document.getElementById("deleteModal");
    const btnYes = deleteModal.querySelector(".btn-yes");
    const btnNo = deleteModal.querySelector(".btn-no");
    const closeBtn = deleteModal.querySelector(".close");

    let rowToDelete = null;

    tableBody.addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-del")) {
            rowToDelete = e.target.closest("tr");
            deleteModal.style.display = "block";
        }
    });

    btnYes.addEventListener("click", async () => {
        if (!rowToDelete) return;

        const productId = rowToDelete.cells[0].innerText;
        try {
            activeCallsBadge.textContent = "Active API Calls: 1";
            await fetch(`https://api.escuelajs.co/api/v1/products/${productId}`, { method: "DELETE" });
            rowToDelete.remove();
            updateBadges();
        } catch (err) {
            console.error("Delete failed:", err);
            errorsCount++;
            updateBadges();
        } finally {
            activeCallsBadge.textContent = "Active API Calls: 0";
            deleteModal.style.display = "none";
            rowToDelete = null;
        }
    });

    [btnNo, closeBtn].forEach(btn => btn.addEventListener("click", () => {
        deleteModal.style.display = "none";
        rowToDelete = null;
    }));

    window.addEventListener("click", (e) => {
        if (e.target === deleteModal) {
            deleteModal.style.display = "none";
            rowToDelete = null;
        }
    });

    
    // ===== ADD/UPDATE PRODUCT =====
    const updateModal = document.getElementById("updateModal");
    const updateForm = document.getElementById("updateForm");
    const updCloseBtn = updateModal.querySelector(".close");
    const errorMsg = updateForm.querySelector(".error-msg");
    const spinner = updateForm.querySelector(".spinner");

    let currentRow = null;
    let currentProductId = null;


    tableBody.addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-upd")) {
            currentRow = e.target.closest("tr");
            currentProductId = currentRow.cells[0].innerText;

            updateForm.title.value = currentRow.cells[2].innerText;
            updateForm.price.value = parseFloat(currentRow.cells[3].innerText.replace("$", ""));
            updateForm.description.value = currentRow.cells[5].innerText;
            updateForm.category.value = currentRow.cells[4].innerText;
            updateForm.image.value = currentRow.cells[1].querySelector("img").src;

            updateModal.style.display = "flex";
        }
    });


    const closeUpdateModal = () => {
        updateModal.style.display = "none";
        errorMsg.style.display = "none";
    };
    updCloseBtn.addEventListener("click", closeUpdateModal);
    window.addEventListener("click", (e) => {
        if (e.target === updateModal) closeUpdateModal();
    });

    updateForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = updateForm.title.value.trim();
        const price = parseFloat(updateForm.price.value);
        const description = updateForm.description.value.trim();
        const category = updateForm.category.value.trim();
        const image = updateForm.image.value.trim();

        if (!title || !description || !category || !image || isNaN(price) || price <= 0) {
            errorMsg.textContent = "Please fill all fields correctly.";
            errorMsg.style.display = "block";
            return;
        }

        spinner.style.display = "inline-block";
        errorMsg.style.display = "none";

        try {
            activeCallsBadge.textContent = "Active API Calls: 1";
            const res = await fetch(`https://api.escuelajs.co/api/v1/products/${currentProductId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, price, description, categoryId: 1, images: [image] })
            });

            if (!res.ok) throw new Error("Update failed");
            const updatedProduct = await res.json();

            currentRow.cells[1].querySelector("img").src = updatedProduct.images[0] || "";
            currentRow.cells[2].innerText = updatedProduct.title;
            currentRow.cells[3].innerText = `$${updatedProduct.price}`;
            currentRow.cells[4].innerText = updatedProduct.category?.name || category;
            currentRow.cells[5].innerText = updatedProduct.description;

            closeUpdateModal();
            updateBadges(); // <-- update badges immediately
        } catch (err) {
            console.error(err);
            errorsCount++;
            updateBadges();
            errorMsg.innerHTML = "&#9888; Error updating product. Please try again.";
            errorMsg.style.display = "block";
        } finally {
            spinner.style.display = "none";
            activeCallsBadge.textContent = "Active API Calls: 0";
        }
    });
});


// add data
const addModal = document.getElementById('addModal');
const addBtn = document.querySelector('.actions-container button:nth-child(2)');
const addClose = document.getElementById('addClose');
const addForm = document.getElementById('addForm');
const addErrorMsg = addForm.querySelector('.error-msg');
const addSpinner = addForm.querySelector('.spinner');


addBtn.addEventListener('click', () => {
    addModal.style.display = 'flex';
    document.body.classList.add('modal-open');
});


// close modal
addClose.addEventListener('click', () => {
    addModal.style.display = 'none';
    document.body.classList.remove('modal-open');
});

window.addEventListener('click', (e) => {
    if (e.target === addModal) {
        addModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
});


// form
addForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = addForm.title.value.trim();
    const price = parseFloat(addForm.price.value);
    const description = addForm.description.value.trim();
    const image = addForm.image.value.trim();
    const category = addForm.category.value.trim();

    if (!title || !description || !category || !image || isNaN(price) || price <= 0) {
        addErrorMsg.innerHTML = "&#9888; Please fill all fields correctly.";
        addErrorMsg.style.display = 'block';
        return;
    } else {
        addErrorMsg.style.display = 'none';
    }

    addSpinner.style.display = 'inline-block';

    setTimeout(() => {
        addSpinner.style.display = 'none';

        // Add product to the table
        const tbody = document.querySelector('.info-table tbody');
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>New</td>
            <td><img src="${image}" alt="${title}"></td>
            <td>${title}</td>
            <td>$${price.toFixed(2)}</td>
            <td>${category}</td>
            <td>${description}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-del">Delete</button>
                    <button class="btn-upd">Update</button>
                </div>
            </td>
        `;
        tbody.appendChild(newRow);


        addForm.reset();
        addModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }, 1000);
});

