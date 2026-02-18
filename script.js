// --- STATE MANAGEMENT ---
let rows = [];
let companies = JSON.parse(localStorage.getItem('mughal_companies')) || [];
let savedProducts = JSON.parse(localStorage.getItem('mughal_products')) || [];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Shared Logic
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker Registered'))
            .catch((err) => console.log('Service Worker Failed', err));
    }

    // Determine Page
    if (document.getElementById('app-ui')) {
        initDashboard();
    } else if (document.getElementById('product-management-ui')) {
        initProductManager();
    }
});

function initDashboard() {
    const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('display-date').innerText = new Date().toLocaleDateString('en-GB', dateOptions);

    addAppRow();
    updateCompanyDropdowns();
    renderProductGrid();

    // Initialize Mobile Tab
    switchTab('products');
    updateCartBadge();
}

function initProductManager() {
    updateCompanyDropdowns();
    renderProductManagementTable();
}

// --- SHARED UTILS ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return; // Guard for pages without toast container if any

    const toast = document.createElement('div');
    toast.className = `px-6 py-3 rounded-xl shadow-xl transform transition-all duration-300 translate-y-10 opacity-0 flex items-center gap-3 min-w-[300px] border-l-4 ${type === 'success' ? 'bg-white border-green-500 text-slate-800' :
        type === 'error' ? 'bg-white border-red-500 text-slate-800' : 'bg-slate-800 border-indigo-500 text-white'
        }`;

    const icon = type === 'success' ? '<i class="fas fa-check-circle text-green-500 text-xl"></i>' :
        type === 'error' ? '<i class="fas fa-exclamation-circle text-red-500 text-xl"></i>' :
            '<i class="fas fa-info-circle text-indigo-400 text-xl"></i>';

    toast.innerHTML = `
        ${icon}
        <div class="flex-1">
            <p class="font-bold text-sm">${type.toUpperCase()}</p>
            <p class="text-xs opacity-90">${message}</p>
        </div>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    });

    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- MOBILE TAB LOGIC (Dashboard Only) ---
function switchTab(tabName) {
    const productsTab = document.getElementById('tab-products');
    const quotationTab = document.getElementById('tab-quotation');
    const quotationContent = document.getElementById('tab-quotation-content');

    if (!productsTab || !quotationTab) return;

    // Reset active states
    productsTab.classList.remove('active');
    quotationTab.classList.remove('active');
    quotationContent.classList.remove('active');

    // Add active state to selected
    if (tabName === 'products') {
        productsTab.classList.add('active');
    } else if (tabName === 'quotation') {
        quotationTab.classList.add('active');
        quotationContent.classList.add('active');

        // Force resize textareas when tab becomes visible
        setTimeout(() => {
            const quotationContent = document.getElementById('app-product-list');
            if (quotationContent) {
                quotationContent.querySelectorAll('textarea').forEach(textarea => {
                    textarea.style.height = 'auto';
                    textarea.style.height = textarea.scrollHeight + 'px';
                });
            }
        }, 50);
    }

    // Update Nav Icons Styling
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => {
        const onClick = btn.getAttribute('onclick');
        if (onClick && onClick.includes(tabName)) {
            btn.classList.add('text-indigo-600');
            btn.classList.remove('text-slate-400');
        } else if (onClick && !onClick.includes('toggleProductManager')) {
            btn.classList.remove('text-indigo-600');
            btn.classList.add('text-slate-400');
        }
    });
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;

    const count = rows.length;

    if (count > 0) {
        badge.innerText = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// --- DASHBOARD PRODUCT LOGIC ---
function toggleProductManager() {
    // Redirect to new page
    window.location.href = 'products.html';
}

function addNewCompany() {
    const input = document.getElementById('new-company-name');
    const name = input.value.trim();
    if (!name) return showToast('Please enter a company name', 'error');

    if (!companies.includes(name)) {
        companies.push(name);
        localStorage.setItem('mughal_companies', JSON.stringify(companies));
        input.value = '';
        updateCompanyDropdowns();
        showToast('Company added successfully!');
    } else {
        showToast('Company already exists', 'error');
    }
}

function updateCompanyDropdowns() {
    // Dashboard Filter
    const dashboardFilter = document.getElementById('filter-company');
    // Manager Filter
    const managerFilter = document.getElementById('manage-filter-company');
    // Common Options
    const options = '<option value="">All Companies</option>' +
        companies.map(c => `<option value="${c}">${c}</option>`).join('');

    if (dashboardFilter) dashboardFilter.innerHTML = options;
    if (managerFilter) managerFilter.innerHTML = options;

    // Edit Modal Dropdown (Manager Page)
    const editCompanySelect = document.getElementById('edit-company');
    if (editCompanySelect) {
        const editOptions = companies.map(c => `<option value="${c}">${c}</option>`).join('');
        editCompanySelect.innerHTML = editOptions;
    }
}

function renderProductGrid() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    const selectedCompany = document.getElementById('filter-company').value;
    const searchTerm = document.getElementById('filter-product-search').value.toLowerCase();

    let filtered = savedProducts;

    if (selectedCompany) {
        filtered = filtered.filter(p => p.company === selectedCompany);
    }

    if (searchTerm) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
    }

    if (filtered.length === 0) {
        grid.innerHTML = '<p class="text-sm text-slate-400 col-span-full text-center py-4">No products found.</p>';
        return;
    }

    grid.innerHTML = filtered.map(p => `
        <div onclick="addProductToQuote('${p.id}')" 
            class="bg-slate-50 border border-slate-200 rounded-lg p-3 cursor-pointer hover:bg-slate-100 hover:border-slate-300 hover:shadow-sm transition-all text-left group h-full flex flex-col justify-between">
            <div>
                <div class="text-[10px] text-indigo-500 font-bold uppercase mb-1 tracking-wide">${p.company}</div>
                <div class="font-semibold text-slate-700 text-sm leading-tight group-hover:text-indigo-700 transition-colors">${p.name}</div>
            </div>
            <div class="text-slate-500 text-xs mt-2 font-mono bg-white inline-block px-2 py-1 rounded border border-slate-100 self-start">Rs ${p.price.toLocaleString()}</div>
        </div>
    `).join('');
}

function addProductToQuote(productId) {
    const product = savedProducts.find(p => p.id === productId);
    if (!product) return;

    const lastRow = rows[rows.length - 1];
    let targetRowId;

    if (rows.length === 1 && !lastRow.name && lastRow.price === 0) {
        targetRowId = lastRow.id;
    } else {
        addAppRow();
        targetRowId = rows[rows.length - 1].id;
    }

    const fullName = `${product.company} ${product.name}`;

    updateRow(targetRowId, 'name', fullName);
    updateRow(targetRowId, 'price', product.price);

    document.querySelector(`#app-product-list textarea[oninput*="'${targetRowId}', 'name'"]`).value = fullName;
    document.querySelector(`#app-product-list input[oninput*="'${targetRowId}', 'price'"]`).value = product.price;

    const textarea = document.querySelector(`#app-product-list textarea[oninput*="'${targetRowId}', 'name'"]`);
    if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    updateRow(targetRowId, 'quantity', 1);
    updateCartBadge();
    showToast('Product added to quotation');
}

// --- PRODUCT MANAGER LOGIC (products.html) ---
function renderProductManagementTable() {
    const tbody = document.getElementById('manage-product-list');
    const emptyState = document.getElementById('manage-empty-state');
    const countDisplay = document.getElementById('product-count-display');
    const mobileGrid = document.getElementById('manage-product-grid');

    if (!tbody || !mobileGrid) return;

    const selectedCompany = document.getElementById('manage-filter-company').value;
    const searchTerm = document.getElementById('manage-search').value.toLowerCase();

    let filtered = savedProducts;

    if (selectedCompany) {
        filtered = filtered.filter(p => p.company === selectedCompany);
    }

    if (searchTerm) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm) || p.company.toLowerCase().includes(searchTerm));
    }

    countDisplay.innerText = `Showing ${filtered.length} products`;

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        mobileGrid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    // Render Desktop Table
    tbody.innerHTML = filtered.map(p => `
        <tr class="hover:bg-slate-50 transition-colors group">
            <td class="p-4 border-b border-slate-100 font-medium text-slate-700">${p.name}</td>
            <td class="p-4 border-b border-slate-100 text-sm text-indigo-600 font-medium">${p.company}</td>
            <td class="p-4 border-b border-slate-100 text-sm font-mono">Rs ${p.price.toLocaleString()}</td>
            <td class="p-4 border-b border-slate-100 text-center">
                <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="openEditProductModal('${p.id}')" class="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-colors" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="openDeleteModal('${p.id}')" class="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors" title="Delete">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // Render Mobile Cards
    mobileGrid.innerHTML = filtered.map(p => `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3">
            <div class="flex justify-between items-start">
                <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">${p.company}</span>
                    <h3 class="font-bold text-slate-800 mt-2 mb-1">${p.name}</h3>
                    <div class="text-sm font-mono text-slate-600 bg-slate-100 inline-block px-2 py-1 rounded">Rs ${p.price.toLocaleString()}</div>
                </div>
            </div>
            <div class="flex gap-2 border-t border-slate-100 pt-3 mt-1">
                <button onclick="openEditProductModal('${p.id}')" class="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="openDeleteModal('${p.id}')" class="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// -- Add/Edit Logic --
let currentEditId = null;

function openAddProductModal() {
    currentEditId = null;
    document.getElementById('modal-title').innerText = 'Add New Product';

    // Reset form
    document.getElementById('edit-company').value = companies[0] || '';
    document.getElementById('edit-name').value = '';
    document.getElementById('edit-price').value = '';
    document.getElementById('edit-new-company').classList.add('hidden');
    document.getElementById('edit-company').parentElement.classList.remove('hidden');

    document.getElementById('edit-modal').classList.remove('hidden');
}

function openEditProductModal(id) {
    const product = savedProducts.find(p => p.id === id);
    if (!product) return;

    currentEditId = id;
    document.getElementById('modal-title').innerText = 'Edit Product';

    document.getElementById('edit-company').value = product.company;
    document.getElementById('edit-name').value = product.name;
    document.getElementById('edit-price').value = product.price;

    // Ensure company exists in dropdown, else it might be a new custom one?
    // For now we assume companies list is up to date.

    document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}

function toggleCompanyInput() {
    const selectDiv = document.getElementById('edit-company').parentElement;
    const input = document.getElementById('edit-new-company');

    if (input.classList.contains('hidden')) {
        selectDiv.classList.add('hidden');
        input.classList.remove('hidden');
        input.focus();
    } else {
        selectDiv.classList.remove('hidden');
        input.classList.add('hidden');
    }
}

function saveProduct() {
    const name = document.getElementById('edit-name').value.trim();
    const price = parseFloat(document.getElementById('edit-price').value);

    let company = document.getElementById('edit-company').value;
    const newCompanyInput = document.getElementById('edit-new-company');

    if (!newCompanyInput.classList.contains('hidden')) {
        const newComp = newCompanyInput.value.trim();
        if (newComp) {
            company = newComp;
            // Add to companies list if new
            if (!companies.includes(company)) {
                companies.push(company);
                localStorage.setItem('mughal_companies', JSON.stringify(companies));
                updateCompanyDropdowns();
            }
        }
    }

    if (!name || isNaN(price) || !company) {
        return showToast('Please fill all fields correctly', 'error');
    }

    if (currentEditId) {
        // Edit existing
        const index = savedProducts.findIndex(p => p.id === currentEditId);
        if (index !== -1) {
            savedProducts[index] = { ...savedProducts[index], company, name, price };
            showToast('Product updated');
        }
    } else {
        // Add New
        const newProduct = {
            id: Date.now().toString(),
            company,
            name,
            price
        };
        savedProducts.push(newProduct);
        showToast('Product added successfully');
    }

    localStorage.setItem('mughal_products', JSON.stringify(savedProducts));
    closeEditModal();
    renderProductManagementTable();
}

// -- Delete Logic --
let productToDeleteId = null;

function openDeleteModal(id) {
    const product = savedProducts.find(p => p.id === id);
    if (!product) return;

    productToDeleteId = id;
    document.getElementById('delete-product-name').innerText = product.name;
    document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.add('hidden');
    productToDeleteId = null;
}

function confirmDelete() {
    if (productToDeleteId) {
        savedProducts = savedProducts.filter(p => p.id !== productToDeleteId);
        localStorage.setItem('mughal_products', JSON.stringify(savedProducts));
        showToast('Product deleted');
        renderProductManagementTable();
    }
    closeDeleteModal();
}


// --- QUOTATION LOGIC (Dashboard) ---
function addAppRow() {
    const id = Date.now().toString();
    rows.push({
        id,
        name: '',
        price: 0,
        quantity: 1,
        discountPercent: 0,
        discountAmount: 0
    });
    renderRows();
    updateTotals();
    updateCartBadge();

    setTimeout(() => {
        const tbody = document.getElementById('app-product-list');
        const lastRow = tbody ? tbody.lastElementChild : null;
        if (lastRow) {
            const firstInput = lastRow.querySelector('textarea');
            if (firstInput) firstInput.focus();
        }
    }, 0);
}

function removeRow(id) {
    if (rows.length > 1) {
        rows = rows.filter(r => r.id !== id);
    } else {
        rows[0] = {
            id: rows[0].id,
            name: '',
            price: 0,
            quantity: 1,
            discountPercent: 0,
            discountAmount: 0
        };
    }
    renderRows();
    updateTotals();
    updateCartBadge();
}

function updateRow(id, field, value) {
    const row = rows.find(r => r.id === id);
    if (!row) return;

    if (field === 'name') {
        row.name = value;
        return;
    }

    let val = parseFloat(value);
    if (isNaN(val)) val = 0;

    if (field === 'price') row.price = val;
    if (field === 'quantity') row.quantity = val;
    if (field === 'discountPercent') row.discountPercent = val;
    if (field === 'discountAmount') row.discountAmount = val;

    const totalAmount = row.price * row.quantity;

    if (field === 'price' || field === 'quantity') {
        row.discountAmount = (totalAmount * row.discountPercent) / 100;
        const discAmtInput = document.getElementById(`input-disc-amt-${id}`);
        if (discAmtInput) discAmtInput.value = row.discountAmount;
    }

    if (field === 'discountPercent') {
        row.discountAmount = (totalAmount * row.discountPercent) / 100;
        const discAmtInput = document.getElementById(`input-disc-amt-${id}`);
        if (discAmtInput) discAmtInput.value = row.discountAmount;
    }

    if (field === 'discountAmount') {
        row.discountPercent = totalAmount > 0 ? (row.discountAmount / totalAmount) * 100 : 0;
        const discPerInput = document.getElementById(`input-disc-per-${id}`);
        if (discPerInput) discPerInput.value = row.discountPercent.toFixed(2);
    }

    const netPrice = Math.max(0, totalAmount - row.discountAmount);

    const totalEl = document.getElementById(`row-total-${id}`);
    if (totalEl) totalEl.innerText = totalAmount.toLocaleString();

    const netEl = document.getElementById(`row-net-${id}`);
    if (netEl) netEl.innerText = netPrice.toLocaleString();

    updateTotals();
}

function renderRows() {
    const tbody = document.getElementById('app-product-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    rows.forEach(row => {
        const totalAmount = row.price * row.quantity;
        const netPrice = Math.max(0, totalAmount - row.discountAmount);

        const tr = document.createElement('tr');
        tr.className = 'product-row';
        tr.innerHTML = `
            <td class="col-name">
                <span class="mobile-label">Product Name</span>
                <textarea 
                    oninput="this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px'; updateRow('${row.id}', 'name', this.value);"
                    onfocus="this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px'"
                    placeholder="Item description"
                    rows="2"
                    class="w-full p-3 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none overflow-hidden bg-transparent min-h-[3.5rem] leading-relaxed"
                >${row.name}</textarea>
            </td>
            <td class="col-price">
                <span class="mobile-label">Price</span>
                <input type="number" value="${row.price || ''}" 
                    oninput="updateRow('${row.id}', 'price', this.value)"
                    placeholder="0"
                    class="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                >
            </td>
            <td class="col-qty">
                <span class="mobile-label">Qty</span>
                <input type="number" value="${row.quantity || ''}" 
                    oninput="updateRow('${row.id}', 'quantity', this.value)"
                    placeholder="1"
                    class="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                >
            </td>
            <td class="col-total">
                <span class="mobile-label">Total</span>
                <span id="row-total-${row.id}" class="font-medium text-slate-600 block py-2">${totalAmount.toLocaleString()}</span>
            </td>
            <td class="col-disc-per">
                <span class="mobile-label">Disc %</span>
                <input id="input-disc-per-${row.id}" type="number" value="${row.discountPercent || ''}" 
                    oninput="updateRow('${row.id}', 'discountPercent', this.value)"
                    placeholder="0"
                    class="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                >
            </td>
             <td class="col-disc-amt">
                <span class="mobile-label">Disc Amt</span>
                <input id="input-disc-amt-${row.id}" type="number" value="${row.discountAmount || ''}" 
                    oninput="updateRow('${row.id}', 'discountAmount', this.value)"
                    placeholder="0"
                    class="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                >
            </td>
            <td class="col-net text-right">
                <span class="mobile-label">Net Price</span>
                <span id="row-net-${row.id}" class="font-bold text-indigo-600 block py-2">${netPrice.toLocaleString()}</span>
            </td>
            <td class="col-action text-center">
                <button onclick="removeRow('${row.id}')" class="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors" tabindex="-1">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Ensure textareas resize correctly after rendering
    setTimeout(() => {
        document.querySelectorAll('#app-product-list textarea').forEach(textarea => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        });
    }, 50);
}

function updateTotals() {
    let sumTotalAmount = 0;
    let sumDiscount = 0;
    let sumNetPrice = 0;

    rows.forEach(row => {
        const totalAmount = row.price * row.quantity;
        const netPrice = Math.max(0, totalAmount - row.discountAmount);

        sumTotalAmount += totalAmount;
        sumDiscount += row.discountAmount;
        sumNetPrice += netPrice;
    });

    const elTotal = document.getElementById('app-total-original');
    const elDisc = document.getElementById('app-total-discount');
    const elGrand = document.getElementById('app-grand-total');

    if (elTotal) elTotal.innerText = sumTotalAmount.toLocaleString();
    if (elDisc) elDisc.innerText = sumDiscount.toLocaleString();
    if (elGrand) elGrand.innerText = "Rs " + sumNetPrice.toLocaleString();
}

// --- PDF LOGIC ---
function generatePDF() {
    const template = document.getElementById('pdf-template');
    const tbody = document.getElementById('pdf-table-body');

    tbody.innerHTML = '';
    let sumTotalAmount = 0, sumDiscount = 0, sumNetPrice = 0;

    rows.forEach(row => {
        const totalAmount = row.price * row.quantity;
        const netPrice = Math.max(0, totalAmount - row.discountAmount);

        sumTotalAmount += totalAmount;
        sumDiscount += row.discountAmount;
        sumNetPrice += netPrice;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.name || '-'}</td>
            <td>${row.price.toLocaleString()}</td>
            <td>${row.quantity}</td>
            <td>${totalAmount.toLocaleString()}</td>
            <td>${row.discountPercent ? row.discountPercent + '%' : '-'}</td>
            <td>${row.discountAmount ? row.discountAmount.toLocaleString() : '-'}</td>
            <td style="text-align:right; font-weight:bold;">${netPrice.toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('pdf-sum-original').innerText = sumTotalAmount.toLocaleString();
    document.getElementById('pdf-sum-discount').innerText = sumDiscount.toLocaleString();
    document.getElementById('pdf-grand-total').innerText = "Rs " + sumNetPrice.toLocaleString();
    document.getElementById('pdf-notes').innerText = document.getElementById('app-notes').value || "Thank you for your business.";

    const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('pdf-date').innerText = new Date().toLocaleDateString('en-GB', dateOptions);

    const invoiceNo = document.getElementById('app-invoice-no').value;
    const customerName = document.getElementById('app-customer-name').value;

    document.getElementById('pdf-invoice-no').innerText = invoiceNo ? `Invoice #: ${invoiceNo}` : '';
    document.getElementById('pdf-customer-name').innerText = customerName ? `Customer: ${customerName}` : '';

    template.style.display = 'block';

    const opt = {
        margin: 5,
        filename: `Quotation_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const btn = document.querySelector("button[onclick='generatePDF()']");
    const originalText = btn.innerHTML;
    let count = 3;

    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Preparing PDF (${count})...`;

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Preparing PDF (${count})...`;
        } else {
            clearInterval(interval);
            btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Generating...`;

            html2pdf().set(opt).from(template).save().then(() => {
                template.style.display = 'none';
                console.log("PDF Saved");
                btn.innerHTML = originalText;
                btn.disabled = false;
            });
        }
    }, 1000);
}
