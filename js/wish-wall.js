/**
 * Logic xử lý gửi và hiển thị lời chúc qua Google Apps Script
 */
$(document).ready(function () {
    const CONFIG = WEDDING_CONFIG;
    const API_URL = CONFIG.wishWebAppUrl;

    const $form = $('#wish-form');
    const $wishList = $('#wish-list-container');
    const $submitBtn = $('#btn-send-wish');

    // 1. Hàm load lời chúc
    function loadWishes() {
        if (!API_URL) {
            $wishList.html('<div class="wish-empty text-center">Chưa có URL API để tải lời chúc.</div>');
            return;
        }

        $wishList.html('<div class="wish-loading"><div class="spinner"></div><p>Đang tải lời chúc...</p></div>');

        $.ajax({
            url: API_URL,
            method: 'GET',
            dataType: 'jsonp', // Sử dụng JSONP để vượt rào CORS
            success: function (data) {
                if (data && data.length > 0) {
                    renderWishes(data);
                } else {
                    $wishList.html('<div class="wish-empty">Hãy là người đầu tiên gửi lời chúc nhé!</div>');
                }
            },
            error: function (err) {
                console.error('Error loading wishes:', err);
                $wishList.html('<div class="wish-empty text-danger">Không thể tải lời chúc. Vui lòng kiểm tra lại cấu hình API và Deployment.</div>');
            }
        });
    }

    // 2. Hàm hiển thị lời chúc lên UI
    function renderWishes(wishes) {
        $wishList.empty();

        // Hiển thị tối đa 50 lời chúc mới nhất (đảo ngược mảng vì data thường lưu cũ trước mới sau)
        const displayWishes = [...wishes].reverse().slice(0, 50);

        displayWishes.forEach(wish => {
            const dateStr = wish.timestamp ? new Date(wish.timestamp).toLocaleString('vi-VN') : '';
            const html = `
                <div class="wish-item">
                    <div class="wish-item-header">
                        <span class="wish-sender">${escapeHtml(wish.name)}</span>
                        <span class="wish-time">${dateStr}</span>
                    </div>
                    <div class="wish-message">${escapeHtml(wish.message)}</div>
                </div>
            `;
            $wishList.append(html);
        });
    }

    // 3. Hàm gửi lời chúc
    $form.on('submit', function (e) {
        e.preventDefault();

        if (!API_URL) {
            UIkit.notification({
                message: 'Chưa cấu hình URL API cho lời chúc!',
                status: 'danger',
                pos: 'top-center'
            });
            return;
        }

        const name = $('#wish-name').val().trim();
        const message = $('#wish-message').val().trim();

        if (!name || !message) {
            UIkit.notification({
                message: 'Vui lòng nhập đầy đủ tên và lời chúc!',
                status: 'warning',
                pos: 'top-center'
            });
            return;
        }

        // Disable button
        $submitBtn.prop('disabled', true).html('<div uk-spinner="ratio: 0.6"></div> Đang gửi...');

        // POST lên GAS qua text/plain để tránh CORS preflight check
        $.ajax({
            url: API_URL,
            method: 'POST',
            data: JSON.stringify({ name, message }),
            contentType: 'text/plain; charset=utf-8',
            success: function (response) {
                UIkit.notification({
                    message: 'Cảm ơn bạn đã gửi lời chúc! ❤️',
                    status: 'success',
                    pos: 'top-center'
                });
                $form[0].reset();
                $submitBtn.prop('disabled', true).text('Đã gửi lời chúc');
                setTimeout(loadWishes, 1500);
            },
            error: function (err) {
                // GAS thường lỗi redirect 302 nhưng dữ liệu vẫn vào Sheet
                UIkit.notification({
                    message: 'Cảm ơn bạn đã gửi lời chúc! ❤️',
                    status: 'success',
                    pos: 'top-center'
                });
                $form[0].reset();
                $submitBtn.prop('disabled', true).text('Đã gửi lời chúc');
                setTimeout(loadWishes, 1500);
            }
            // Bỏ phần complete re-enable để giữ nút bị disable theo yêu cầu
        });
    });

    // Helper: AntiXSS
    function escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.toString().replace(/[&<>"']/g, function (m) { return map[m]; });
    }

    // Khởi tạo
    loadWishes();
});
