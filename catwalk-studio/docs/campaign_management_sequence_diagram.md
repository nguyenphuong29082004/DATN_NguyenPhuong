# Biểu đồ trình tự cho chức năng Tạo chiến dịch

Tài liệu này chứa biểu đồ trình tự mô tả luồng xử lý khi người dùng tạo một chiến dịch mới trong Catwalk Studio.

## Biểu đồ trình tự (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor NguoiDung as :NguoiDung
    participant UI as :CampaignUI
    participant Control as :CampaignController
    participant Repo as :CAMPAIGNS

    NguoiDung->>UI: Kích chọn Create Campaign
    activate UI
    UI->>Control: xuLyTaoChienDich(data)
    activate Control
    
    Control->>Repo: createCampaign(campaign)
    activate Repo
    Repo-->>Control: return ket qua
    deactivate Repo
    
    Control-->>UI: return ket qua
    deactivate Control
    
    UI->>UI: hienThiKetQua()
    activate UI
    deactivate UI
    deactivate UI
```

## Giải thích luồng xử lý

1.  **Người dùng** tương tác với giao diện và nhấn nút để tạo chiến dịch mới.
2.  **CampaignUI** thu thập dữ liệu và gọi phương thức xử lý tại **CampaignController**.
3.  **CampaignController** thực hiện các logic nghiệp vụ và gọi **CAMPAIGNS (Repository)** để lưu dữ liệu vào hệ thống.
4.  Sau khi dữ liệu được lưu thành công, kết quả được trả ngược về cho giao diện.
5.  **CampaignUI** thực hiện việc hiển thị kết quả hoặc điều hướng người dùng đến trang chi tiết chiến dịch.
