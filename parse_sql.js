const fs = require('fs');

const sqlFilePath = 'backup-2026-02-17-19-17-39.sql';
const outputHtmlPath = 'import.html';

try {
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // --- Extract Categories ---
    const categoriesStart = sqlContent.indexOf("INSERT INTO `categories` VALUES");
    let categoryMap = new Map();

    if (categoriesStart !== -1) {
        let chunk = sqlContent.substring(categoriesStart);
        let endIdx = chunk.indexOf(';');
        if (endIdx !== -1) chunk = chunk.substring(0, endIdx);

        const regex = /\((\d+),'([^']+)'/g;
        let match;
        while ((match = regex.exec(chunk)) !== null) {
            categoryMap.set(match[1], match[2]);
        }
    }

    console.log(`Found ${categoryMap.size} categories.`);

    // --- Extract Items ---
    const itemsStart = sqlContent.indexOf("INSERT INTO `items` VALUES");
    const products = [];
    const companiesSet = new Set();

    if (itemsStart !== -1) {
        let chunk = sqlContent.substring(itemsStart);
        let endIdx = chunk.indexOf(';');
        if (endIdx !== -1) chunk = chunk.substring(0, endIdx);

        // Regex for items
        const itemRegex = /\(\d+,(\d+),\d+,'[^']+','([^']+)',[\d\.]+,[\d]+,[\d]+,'[^']+',([\d\.]+),/g;

        let match;
        while ((match = itemRegex.exec(chunk)) !== null) {
            const catId = match[1];
            let name = match[2];
            const price = parseFloat(match[3]);

            const company = categoryMap.get(catId);

            if (company) {
                companiesSet.add(company);

                // Clean Name: Remove company name from start
                if (name.toLowerCase().startsWith(company.toLowerCase())) {
                    name = name.substring(company.length).trim();
                    if (name.startsWith('-') || name.startsWith(' ')) {
                        name = name.replace(/^[\s-]+/, '');
                    }
                }

                products.push({
                    id: Date.now().toString() + Math.floor(Math.random() * 1000000),
                    company: company,
                    name: name,
                    price: price
                });
            }
        }
    }

    const data = {
        companies: Array.from(companiesSet),
        products: products
    };

    console.log(`Extracted ${products.length} products.`);

    // --- Generate HTML ---
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Importing Data</title>
    <style>
        body { font-family: sans-serif; padding: 2rem; background: #f0fdf4; color: #166534; text-align: center; }
        .success { display: none; }
        .error { color: #dc2626; display: none; }
    </style>
</head>
<body>
    <h1>Importing Product Data...</h1>
    <p id="status">Please wait...</p>
    
    <div id="result" class="success">
        <h2>Success!</h2>
        <p>Data has been imported into your browser storage.</p>
        <p><strong>${data.companies.length} Companies</strong> and <strong>${data.products.length} Products</strong> were added.</p>
        <p><a href="index.html" style="font-weight: bold; font-size: 1.5rem; text-decoration: underline;">Click here to Open Dashboard</a></p>
    </div>
    
    <div id="error" class="error">
        <h2>Error</h2>
        <p id="error-msg"></p>
    </div>

    <script>
        try {
            const data = ${JSON.stringify(data)};
            
            // Overwrite LocalStorage
            localStorage.setItem('mughal_companies', JSON.stringify(data.companies));
            localStorage.setItem('mughal_products', JSON.stringify(data.products));
            
            document.getElementById('status').style.display = 'none';
            document.getElementById('result').style.display = 'block';
            
            console.log('Import successful');
        } catch (err) {
            document.getElementById('status').style.display = 'none';
            document.getElementById('error').style.display = 'block';
            document.getElementById('error-msg').textContent = err.message;
            console.error(err);
        }
    </script>
</body>
</html>`;

    fs.writeFileSync(outputHtmlPath, htmlContent);
    console.log(`Generated ${outputHtmlPath}`);

} catch (e) {
    console.error(e);
}
