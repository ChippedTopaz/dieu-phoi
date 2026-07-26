const EformEngine = {
    // [QUAN TRỌNG] Dán link CSV của Sheet CauHinhEform vào đây:
    CONFIG_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlBaBQWrwlVYTKY0zr2t7M-xnplWarLHSWjdDznpg32V1aZUrnxyirY-HNGo11jozXX7ZnUhsoBBoS/pub?gid=317161459&single=true&output=csv",

    init() {
        this.fetchConfig();
        this.setupCCCDScanner();
    },

    // Đọc dữ liệu từ Google Sheets
    async fetchConfig() {
        try {
            const response = await fetch(this.CONFIG_URL);
            const csvText = await response.text();
            const data = this.parseCSV(csvText);
            this.renderFormList(data);
        } catch (error) {
            document.getElementById('eform-grid').innerHTML = '<div style="color:red; padding: 20px;">Lỗi tải cấu hình biểu mẫu từ hệ thống!</div>';
        }
    },

    // Hàm bóc tách CSV đơn giản
    parseCSV(str) {
        const lines = str.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const result = [];
        for(let i = 1; i < lines.length; i++) {
            if(!lines[i].trim()) continue;
            const currentline = lines[i].split(',');
            let obj = {};
            for(let j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentline[j] ? currentline[j].trim() : '';
            }
            result.push(obj);
        }
        return result;
    },

    renderFormList(data) {
        const grid = document.getElementById('eform-grid');
        grid.innerHTML = '';
        data.forEach(item => {
            if (!item.MaForm) return; // Bỏ qua dòng trống
            const card = document.createElement('div');
            card.className = 'form-card';
            card.innerHTML = `
                <div class="badge">${item.LinhVuc || 'Khác'}</div>
                <h3 style="margin-top: 0; color: #1f2937;">${item.TenForm}</h3>
                <div style="font-size: 13px; color: #6b7280;">Mã: ${item.MaForm}</div>
            `;
            card.onclick = () => this.openFocusMode(item);
            grid.appendChild(card);
        });
    },

    async openFocusMode(item) {
        document.getElementById('landing-screen').className = 'screen-hidden';
        document.getElementById('workspace-screen').className = 'screen-active';
        document.getElementById('current-form-title').innerText = item.TenForm;
        
        // Tải file template HTML từ thư mục templates/
        try {
            const response = await fetch(item.FileTemplate);
            if (!response.ok) throw new Error('Không tìm thấy file template');
            const htmlContent = await response.text();
            document.getElementById('a4-template-container').innerHTML = htmlContent;
            
            this.generateInputForm(); // Quét và vẽ form
        } catch (error) {
            document.getElementById('a4-template-container').innerHTML = `<div style="color:red; padding:20px;">Lỗi: Không tải được mẫu giấy A4 (${item.FileTemplate}). Vui lòng kiểm tra lại cấu hình trên Sheet!</div>`;
            document.getElementById('dynamic-inputs').innerHTML = '';
        }
    },

    generateInputForm() {
        const container = document.getElementById('dynamic-inputs');
        container.innerHTML = ''; 
        
        const spans = document.querySelectorAll('.ef-data');
        spans.forEach(span => {
            const label = span.getAttribute('data-label') || 'Trường dữ liệu';
            const inputId = 'input-' + span.id;
            const cccdType = span.getAttribute('data-type'); 
            
            const group = document.createElement('div');
            group.className = 'dynamic-input-group';
            group.innerHTML = `
                <label>${label}</label>
                <input type="text" id="${inputId}" data-target="${span.id}" data-cccd="${cccdType}" placeholder="Nhập ${label.toLowerCase()}...">
            `;
            container.appendChild(group);

            document.getElementById(inputId).addEventListener('input', function() {
                document.getElementById(this.getAttribute('data-target')).innerText = this.value || '...................................................';
            });
        });
    },

    setupCCCDScanner() {
        const scannerInput = document.getElementById('cccd-input');
        if (!scannerInput) return;
        scannerInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const qrData = this.value.split('|');
                if (qrData.length >= 6) {
                    const idInput = document.querySelector('input[data-cccd="cccd-id"]');
                    const nameInput = document.querySelector('input[data-cccd="cccd-name"]');
                    const dobInput = document.querySelector('input[data-cccd="cccd-dob"]');
                    const addressInput = document.querySelector('input[data-cccd="cccd-address"]');
                    
                    if(idInput) { idInput.value = qrData[0]; idInput.dispatchEvent(new Event('input')); }
                    if(nameInput) { nameInput.value = qrData[2]; nameInput.dispatchEvent(new Event('input')); }
                    // Xử lý chuỗi ngày sinh (VD: 01011990 -> 01/01/1990)
                    if(dobInput && qrData[3].length === 8) { 
                        const dob = qrData[3];
                        dobInput.value = `${dob.substring(0,2)}/${dob.substring(2,4)}/${dob.substring(4)}`; 
                        dobInput.dispatchEvent(new Event('input')); 
                    }
                    if(addressInput) { addressInput.value = qrData[5]; addressInput.dispatchEvent(new Event('input')); }
                    
                    this.value = ''; 
                } else {
                    alert("Mã QR không hợp lệ!");
                }
            }
        });
    },

    backToLanding() {
        document.getElementById('workspace-screen').className = 'screen-hidden';
        document.getElementById('landing-screen').className = 'screen-active';
        document.getElementById('a4-template-container').innerHTML = ''; // Dọn dẹp bộ nhớ
    }
};

window.onload = () => EformEngine.init();
