// --- STATE MANAGEMENT ---
let rows = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('display-date').innerText = new Date().toLocaleDateString('en-GB', dateOptions);

    addAppRow();

    // Register Service Worker for Caching
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker Registered'))
            .catch((err) => console.log('Service Worker Failed', err));
    }
});

// --- APP LOGIC ---
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

    // Auto-focus the first input of the new row
    setTimeout(() => {
        const tbody = document.getElementById('app-product-list');
        const lastRow = tbody.lastElementChild;
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
        // Reset the last remaining row
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
}

function updateRow(id, field, value) {
    const row = rows.find(r => r.id === id);
    if (!row) return;

    if (field === 'name') {
        row.name = value;
        // Height adjustment is handled inline in HTML
        return;
    }

    let val = parseFloat(value);
    if (isNaN(val)) val = 0;

    // Update the specific field
    if (field === 'price') row.price = val;
    if (field === 'quantity') row.quantity = val;
    if (field === 'discountPercent') row.discountPercent = val;
    if (field === 'discountAmount') row.discountAmount = val;

    // --- RECALCULATION LOGIC ---
    const totalAmount = row.price * row.quantity;

    if (field === 'price' || field === 'quantity') {
        // Keep Discount % constant, recalculate Discount Amount
        row.discountAmount = (totalAmount * row.discountPercent) / 100;
        // Update Discount Amount Input
        const discAmtInput = document.getElementById(`input-disc-amt-${id}`);
        if (discAmtInput) discAmtInput.value = row.discountAmount; // format?
    }

    if (field === 'discountPercent') {
        // Recalculate Discount Amount based on new %
        row.discountAmount = (totalAmount * row.discountPercent) / 100;
        // Update Discount Amount Input
        const discAmtInput = document.getElementById(`input-disc-amt-${id}`);
        if (discAmtInput) discAmtInput.value = row.discountAmount;
    }

    if (field === 'discountAmount') {
        // Recalculate Discount % based on new Amount
        row.discountPercent = totalAmount > 0 ? (row.discountAmount / totalAmount) * 100 : 0;
        // Update Discount % Input
        const discPerInput = document.getElementById(`input-disc-per-${id}`);
        if (discPerInput) discPerInput.value = row.discountPercent.toFixed(2);
    }

    // --- UI UPDATES (SPANS) ---
    const netPrice = Math.max(0, totalAmount - row.discountAmount);

    const totalEl = document.getElementById(`row-total-${id}`);
    if (totalEl) totalEl.innerText = totalAmount.toLocaleString();

    const netEl = document.getElementById(`row-net-${id}`);
    if (netEl) netEl.innerText = netPrice.toLocaleString();

    updateTotals();
}

function renderRows() {
    const tbody = document.getElementById('app-product-list');
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
                    oninput="updateRow('${row.id}', 'name', this.value); this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px'"
                    placeholder="Item description"
                    rows="1"
                    class="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none overflow-hidden bg-transparent min-h-[44px]"
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

    // Auto-resize textareas after rendering
    document.querySelectorAll('#app-product-list textarea').forEach(textarea => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    });
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

    document.getElementById('app-total-original').innerText = sumTotalAmount.toLocaleString();
    document.getElementById('app-total-discount').innerText = sumDiscount.toLocaleString();
    document.getElementById('app-grand-total').innerText = "Rs " + sumNetPrice.toLocaleString();
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

    // Transfer Invoice No and Customer Name
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

            // Generate PDF after countdown
            html2pdf().set(opt).from(template).save().then(() => {
                template.style.display = 'none';
                console.log("PDF Saved");
                btn.innerHTML = originalText;
                btn.disabled = false;
            });
        }
    }, 1000);
}
