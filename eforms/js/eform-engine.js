const EformEngine = {
    // Tạm thời cấu hình cứng để test giao diện. Hôm sau ta sẽ móc link Google Sheets vào đây
    mockData: [
        { MaForm: "EF01", TenForm: "Tờ khai xác nhận tình trạng hôn nhân", LinhVuc: "Hộ tịch", FileTemplate: "templates/xac-nhan-hon-nhan.html" }
    ],

    init() {
        this.renderFormList(this.mockData);
        this.setupCCCDScanner();
    },

    // 1. Hiển thị danh sách biểu mẫu ở Sảnh
    renderFormList(data) {
        const grid = document.getElementById('eform-grid');
        grid.innerHTML = '';
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'form-card';
            card.innerHTML = `
                <div class="badge">${item.LinhVuc}</div>
                <h3 style="margin-top: 0; color: #1f2937;">${item.TenForm}</h3>
                <div style="font-size: 13px; color: #6b7280;">Mã: ${item.MaForm}</div>
            `;
            // Khi click, chuyển sang Focus Mode và tải Template
            card.onclick = () => this.openFocusMode(item);
            grid.appendChild(card);
        });
    },

    // 2. Chuyển sang Focus Mode
    openFocusMode(item) {
        document.getElementById('landing-screen').className = 'screen-hidden';
        document.getElementById('workspace-screen').className = 'screen-active';
        document.getElementById('current-form-title').innerText = item.TenForm;
        
        // Tải file HTML làm tờ giấy A4 (Hiện tại em giả lập HTML cứng, bước sau sẽ fetch file thực tế)
        const mockHtmlTemplate = `
            <div style="text-align: center; font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc lập - Tự do - Hạnh phúc</div>
            <h2 style="text-align: center;">TỜ KHAI XÁC NHẬN TÌNH TRẠNG HÔN NHÂN</h2>
            <p>Họ, chữ đệm, tên người yêu cầu: <span class="ef-data" id="ef-hoten" data-label="Họ và tên" data-type="cccd-name">.........................</span></p>
            <p>Ngày, tháng, năm sinh: <span class="ef-data" id="ef-ngaysinh" data-label="Ngày sinh" data-type="cccd-dob">.........................</span></p>
            <p>Nơi cư trú: <span class="ef-data" id="ef-noicutru" data-label="Nơi cư trú" data-type="cccd-address">.........................</span></p>
        `;
        document.getElementById('a4-template-container').innerHTML = mockHtmlTemplate;
        
        // Kích hoạt Cỗ máy Tự động vẽ Form
        this.generateInputForm();
    },

    // 3. THUẬT TOÁN ĐỌC TỜ A4 VÀ VẼ Ô NHẬP LIỆU
    generateInputForm() {
        const container = document.getElementById('dynamic-inputs');
        container.innerHTML = ''; // Xóa form cũ
        
        // Quét toàn bộ thẻ span có class ef-data trên giấy A4
        const spans = document.querySelectorAll('.ef-data');
        
        spans.forEach(span => {
            const label = span.getAttribute('data-label') || 'Trường dữ liệu';
            const inputId = 'input-' + span.id;
            const cccdType = span.getAttribute('data-type'); // Dùng để hứng dữ liệu quét mã
            
            // Vẽ 1 cụm thẻ Label + Input
            const group = document.createElement('div');
            group.className = 'dynamic-input-group';
            group.innerHTML = `
                <label>${label}</label>
                <input type="text" id="${inputId}" data-target="${span.id}" data-cccd="${cccdType}" placeholder="Nhập ${label.toLowerCase()}...">
            `;
            container.appendChild(group);

            // Gắn sự kiện Data Binding: Cứ gõ phím ở ô input là chữ chạy sang tờ A4
            document.getElementById(inputId).addEventListener('input', function() {
                document.getElementById(this.getAttribute('data-target')).innerText = this.value || '.........................';
            });
        });
    },

    // 4. Khởi tạo súng quét CCCD
    setupCCCDScanner() {
        const scannerInput = document.getElementById('cccd-input');
        scannerInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const qrData = this.value.split('|');
                if (qrData.length >= 6) {
                    // Truy lùng các ô input do hệ thống tự sinh để điền dữ liệu
                    const nameInput = document.querySelector('input[data-cccd="cccd-name"]');
                    const dobInput = document.querySelector('input[data-cccd="cccd-dob"]');
                    const addressInput = document.querySelector('input[data-cccd="cccd-address"]');
                    
                    if(nameInput) { nameInput.value = qrData[2]; nameInput.dispatchEvent(new Event('input')); }
                    if(dobInput) { dobInput.value = qrData[3]; dobInput.dispatchEvent(new Event('input')); }
                    if(addressInput) { addressInput.value = qrData[5]; addressInput.dispatchEvent(new Event('input')); }
                    
                    this.value = ''; // Xóa trắng ô quét
                    alert('Đã điền tự động dữ liệu Căn cước!');
                }
            }
        });
    },

    backToLanding() {
        document.getElementById('workspace-screen').className = 'screen-hidden';
        document.getElementById('landing-screen').className = 'screen-active';
    }
};

// Chạy hệ thống khi web tải xong
window.onload = () => EformEngine.init();
