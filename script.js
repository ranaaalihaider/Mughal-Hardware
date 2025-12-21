// --- STATE MANAGEMENT ---
let rows = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('display-date').innerText = new Date().toLocaleDateString('en-GB', dateOptions);

    addAppRow();
});

// --- APP LOGIC ---
function addAppRow() {
    const id = Date.now().toString();
    rows.push({ id, name: '', price: 0, discount: 0 });
    renderRows();
    updateTotals();

    // Auto-focus the first input of the new row
    setTimeout(() => {
        const tbody = document.getElementById('app-product-list');
        const lastRow = tbody.lastElementChild;
        if (lastRow) {
            const firstInput = lastRow.querySelector('input');
            if (firstInput) firstInput.focus();
        }
    }, 0);
}

function removeRow(id) {
    if (rows.length > 1) {
        rows = rows.filter(r => r.id !== id);
    } else {
        rows[0] = { id: rows[0].id, name: '', price: 0, discount: 0 };
    }
    renderRows();
    updateTotals();
}

function updateRow(id, field, value) {
    const row = rows.find(r => r.id === id);
    if (!row) return;

    if (field === 'name') {
        row.name = value;
    } else {
        let val = parseFloat(value) || 0;
        if (field === 'discount' && val > row.price) val = row.price;
        row[field] = val;

        // Visual Update for specific row TOTAL only (No re-renders!)
        const final = Math.max(0, row.price - row.discount);
        const totalSpan = document.getElementById(`total-${id}`);
        if (totalSpan) totalSpan.innerText = final.toLocaleString();
    }
    updateTotals();
}

function renderRows() {
    const tbody = document.getElementById('app-product-list');
    tbody.innerHTML = '';

    rows.forEach(row => {
        const final = Math.max(0, row.price - row.discount);

        const tr = document.createElement('tr');
        tr.className = 'product-row';
        tr.innerHTML = `
            <td class="col-name">
                <span class="mobile-label">Product Name</span>
                <textarea 
                    oninput="updateRow('${row.id}', 'name', this.value); this.style.height = ''; this.style.height = this.scrollHeight + 'px'"
                    placeholder="Item description"
                    rows="1"
                    class="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none overflow-hidden bg-transparent"
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
            <td class="col-discount">
                <span class="mobile-label">Discount</span>
                <input type="number" value="${row.discount || ''}" 
                    oninput="updateRow('${row.id}', 'discount', this.value)"
                    placeholder="0"
                    class="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                >
            </td>
            <td class="col-final text-right">
                <span class="mobile-label">Total</span>
                <span id="total-${row.id}">${final.toLocaleString()}</span>
            </td>
            <td class="col-action text-center">
                <button onclick="removeRow('${row.id}')" class="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors" tabindex="-1">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateTotals() {
    let sumOriginal = 0;
    let sumDiscount = 0;
    let grandTotal = 0;

    rows.forEach(row => {
        const final = Math.max(0, row.price - row.discount);
        sumOriginal += row.price;
        sumDiscount += row.discount;
        grandTotal += final;
    });

    document.getElementById('app-total-original').innerText = sumOriginal.toLocaleString();
    document.getElementById('app-total-discount').innerText = sumDiscount.toLocaleString();
    document.getElementById('app-grand-total').innerText = "Rs " + grandTotal.toLocaleString();
}

// --- PDF LOGIC ---
function generatePDF() {
    const template = document.getElementById('pdf-template');
    const tbody = document.getElementById('pdf-table-body');

    tbody.innerHTML = '';
    let sumOriginal = 0, sumDiscount = 0, grandTotal = 0;

    rows.forEach(row => {
        const final = Math.max(0, row.price - row.discount);
        sumOriginal += row.price;
        sumDiscount += row.discount;
        grandTotal += final;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.name || '-'}</td>
            <td>${row.price.toLocaleString()}</td>
            <td>${row.discount ? row.discount.toLocaleString() : '-'}</td>
            <td style="text-align:right; font-weight:500;">${final.toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('pdf-sum-original').innerText = sumOriginal.toLocaleString();
    document.getElementById('pdf-sum-discount').innerText = sumDiscount.toLocaleString();
    document.getElementById('pdf-grand-total').innerText = "Rs " + grandTotal.toLocaleString();
    document.getElementById('pdf-notes').innerText = document.getElementById('app-notes').value || "Thank you for your business.";

    const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('pdf-date').innerText = new Date().toLocaleDateString('en-GB', dateOptions);

    template.style.display = 'block';

    const opt = {
        margin: 10,
        filename: `Quotation_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(template).save().then(() => {
        template.style.display = 'none';
        console.log("PDF Saved");
    });
}
