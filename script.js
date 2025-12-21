// Set current date
document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-PK', {
    year: 'numeric', month: 'long', day: 'numeric'
});

const productList = document.getElementById('product-list');

// Initial row
addProductRow();

function addProductRow() {
    const rowId = 'row-' + Date.now();
    const row = document.createElement('tr');
    row.id = rowId;
    row.className = 'bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors group';

    row.innerHTML = `
        <td class="px-4 py-4" data-label="Product Name">
            <input type="text" placeholder="Item name" class="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-300 rounded-lg px-3 py-2 text-slate-700 placeholder-slate-400 text-sm font-medium transition-all focus:ring-2 focus:ring-indigo-100 outline-none" />
        </td>
        <td class="px-4 py-4" data-label="Price (PKR)">
            <input type="number" min="0" placeholder="0" oninput="calculateRow('${rowId}')" class="price-input w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-right text-slate-600 text-sm font-medium transition-all" />
        </td>
        <td class="px-4 py-4" data-label="Discount (PKR)">
            <div class="relative">
                <input type="number" min="0" placeholder="0" oninput="calculateRow('${rowId}')" class="discount-input w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-right text-slate-600 text-sm font-medium transition-all" />
            </div>
        </td>
        <td class="px-4 py-4 text-right font-bold text-slate-700 final-price tracking-wide" data-label="Final Price">
            0
        </td>
        <td class="px-4 py-4 text-center exclude-from-pdf" data-label="Action">
            <button onclick="removeRow('${rowId}')" class="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 md:focus:opacity-100">
                <i class="fas fa-trash-alt"></i>
            </button>
        </td>
    `;

    productList.appendChild(row);
    // Focus on the first input of the new row
    row.querySelector('input').focus();
}

function removeRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
        row.remove();
        updateTotals();
    }
}

function calculateRow(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;

    const priceInput = row.querySelector('.price-input');
    const discountInput = row.querySelector('.discount-input');
    const finalPriceDisplay = row.querySelector('.final-price');

    let price = parseFloat(priceInput.value) || 0;
    let discountAmount = parseFloat(discountInput.value) || 0;

    // Sanity check
    if (discountAmount < 0) discountAmount = 0;
    // Optional: if discount > price ? Let's allow it for now or cap it? 
    // Usually discount shouldn't exceed price.
    if (discountAmount > price) discountAmount = price;

    const finalPrice = price - discountAmount;

    finalPriceDisplay.textContent = formatCurrency(finalPrice);

    // Store raw values for total calculation if needed, or just re-read inputs in updateTotals
    updateTotals();
}

function updateTotals() {
    let totalCount = 0;
    let sumOriginal = 0;
    let sumDiscount = 0;
    let sumFinal = 0;

    const rows = productList.querySelectorAll('tr');

    rows.forEach(row => {
        const priceInput = row.querySelector('.price-input');
        const discountInput = row.querySelector('.discount-input');

        // Only count rows that have some value to avoid empty rows skewing count? 
        // Or just count all rows. Prompt says "Total number of products".
        // Let's count all rows displayed.
        totalCount++;

        let price = parseFloat(priceInput.value) || 0;
        let discountVal = parseFloat(discountInput.value) || 0;

        if (discountVal < 0) discountVal = 0;
        if (discountVal > price) discountVal = price;

        const discountAmount = discountVal;
        const finalPrice = price - discountAmount;

        sumOriginal += price;
        sumDiscount += discountAmount;
        sumFinal += finalPrice;
    });

    document.getElementById('total-count').textContent = totalCount;
    document.getElementById('sum-original').textContent = formatCurrency(sumOriginal);
    document.getElementById('sum-discount').textContent = formatCurrency(sumDiscount);
    document.getElementById('sum-final').textContent = formatCurrency(sumFinal);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(amount).replace('PKR', '').trim();
}

function generatePDF() {
    const element = document.getElementById('quotation-content');
    const opt = {
        margin: [0, 0, 0, 0], // Zero margin for full bleeding if needed, or standard [10, 10, 10, 10]
        filename: `Quotation_MughalHardware_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Temporarily hide "exclude-from-pdf" elements
    document.body.classList.add('printing-mode');
    const buttons = document.querySelectorAll('.exclude-from-pdf');
    buttons.forEach(el => el.style.visibility = 'hidden');

    html2pdf().set(opt).from(element).save().then(() => {
        // Restore
        buttons.forEach(el => el.style.visibility = 'visible');
        document.body.classList.remove('printing-mode');
    });
}
