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
                            <button class="btn-del">Delete</button>
                            <button class="btn-upd">Update</button>
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

    var rowToDelete = null;

    tableBody.addEventListener("click", function(e) {
        if (e.target.classList.contains("btn-del")) {
            rowToDelete = e.target.closest("tr");
            deleteModal.style.display = "block";
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

    var currentRow = null;
    var currentProductId = null;

    tableBody.addEventListener("click", function(e) {
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

    updateForm.addEventListener("submit", function(e) {
        e.preventDefault();

        var title = updateForm.title.value.trim();
        var price = parseFloat(updateForm.price.value);
        var description = updateForm.description.value.trim();
        var category = updateForm.category.value.trim();
        var image = updateForm.image.value.trim();

        if (!title || !description || !category || !image || isNaN(price) || price <= 0) {
            errorMsg.textContent = "Please fill all fields correctly.";
            errorMsg.style.display = "block";
            return;
        }

        spinner.style.display = "inline-block";
        errorMsg.style.display = "none";
        activeCallsBadge.textContent = "Active API Calls: 1";

        fetch("https://api.escuelajs.co/api/v1/products/" + currentProductId, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: title,
                price: price,
                description: description,
                categoryId: 1,
                images: [image]
            })
        })
        .then(function(res) {
            if (!res.ok) throw new Error("Update failed");
            return res.json();
        })
        .then(function(updatedProduct) {
            currentRow.cells[1].querySelector("img").src = updatedProduct.images[0] || "";
            currentRow.cells[2].innerText = updatedProduct.title;
            currentRow.cells[3].innerText = "$" + updatedProduct.price;
            currentRow.cells[4].innerText = updatedProduct.category && updatedProduct.category.name ? updatedProduct.category.name : category;
            currentRow.cells[5].innerText = updatedProduct.description;

            updateModal.style.display = "none";
            updateBadges();
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
    var addModal = document.getElementById('addModal');
    var addBtn = document.querySelector('.actions-container button:nth-child(2)');
    var addClose = document.getElementById('addClose');
    var addForm = document.getElementById('addForm');
    var addErrorMsg = addForm.querySelector('.error-msg');
    var addSpinner = addForm.querySelector('.spinner');

    addBtn.addEventListener('click', function() {
        addModal.style.display = 'flex';
        document.body.classList.add('modal-open');
    });

    addClose.addEventListener('click', function() {
        addModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    });

    window.addEventListener('click', function(e) {
        if (e.target === addModal) {
            addModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    });

    addForm.addEventListener('submit', function(e) {
        e.preventDefault();

        var title = addForm.title.value.trim();
        var price = parseFloat(addForm.price.value);
        var description = addForm.description.value.trim();
        var image = addForm.image.value.trim();
        var category = addForm.category.value.trim();

        if (!title || !description || !category || !image || isNaN(price) || price <= 0) {
            addErrorMsg.innerHTML = "&#9888; Please fill all fields correctly.";
            addErrorMsg.style.display = 'block';
            return;
        } else {
            addErrorMsg.style.display = 'none';
        }

        addSpinner.style.display = 'inline-block';

        setTimeout(function() {
            addSpinner.style.display = 'none';

            var newRow = document.createElement('tr');
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
            tableBody.appendChild(newRow);

            addForm.reset();
            addModal.style.display = 'none';
            document.body.classList.remove('modal-open');
            updateBadges();
        }, 1000);
    });

});


