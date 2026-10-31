# Checklist rủi ro vận hành — vận chuyển và nghiệp vụ toàn hệ thống

Ngày viết: 26/10/2026.

Đây là danh sách để rà rủi ro. File này không phải luật mới, không thay [mô tả dự án và luồng](00_MO_TA_DU_AN_VA_LUONG.md), và không phải biên bản nghiệm thu.

Coldi là sàn vận tải lạnh. Chủ hàng đăng đơn và ghi cước niêm yết. Nhà xe tự nhận, tự gán xe và tài xế. Tài xế xác nhận lấy hàng, gửi vị trí, xác nhận giao. Xác nhận giao ghi nhận hàng đã giao. Bước đó không thu tiền, không xuất hóa đơn, không kết sổ.

Ba câu để đọc mỗi dòng cho đúng:

| Câu trong bảng | Nghĩa |
| --- | --- |
| **Đã chốt** | Luật nghiệp vụ đang dùng. |
| **Có mã** | Đã có đường chạy thử. Có mã chưa có nghĩa đã chặn được rủi ro ngoài đời. |
| **Còn mở / chưa làm** | Chưa được duyệt hoặc chưa có trong bản đang chạy. Không được coi là đã có cách xử lý. |

Mức trong bảng là mức để ưu tiên rà, không phải định mức bảo hiểm và không phải SLA.

| Mức | Cách hiểu |
| --- | --- |
| Cao | Có thể mất hàng lạnh, mất lòng tin hai bên, hoặc ghi nhận tiền sai. |
| Trung bình | Chuyến bị kẹt, thông tin lệch, hoặc xử lý chậm. |
| Thấp | Gây hiểu nhầm, ít làm hỏng hàng hoặc hỏng sổ nếu người dùng đọc đúng chữ trên màn hình. |

## Cách dùng

- Trước khi nhận một chuyến thật, nhà xe và chủ hàng đi **Phần A**.
- Khi rà cả sản phẩm (demo, UAT, hoặc trước khi bàn vận hành thật), đi **Phần B**.
- Cột "Việc cần kiểm" là việc người vận hành làm. Cột "Sản phẩm đang làm gì" chỉ mô tả hành vi đã có, để khỏi tưởng hệ thống đã chặn giúp.

---

## Phần A — Rủi ro trên một chuyến

Luồng người dùng thấy: **Đang tìm xe** → nhà xe nhận → gán xe và tài xế (**Chờ lấy hàng**) → tài xế xác nhận lấy (**Đang vận chuyển**) → tài xế xác nhận giao (**Đã xác nhận giao hàng**).

GPS cho biết xe đang ở đâu. GPS không thay nút lấy hàng và không thay nút giao hàng.

### A1. Lúc đăng đơn

| Mã | Rủi ro | Mức | Sản phẩm đang làm gì | Việc cần kiểm |
| --- | --- | --- | --- | --- |
| A1-01 | Chọn sai nhóm nhiệt. Đơn chỉ có ba nhóm: Lạnh mát, Đông, Cực lạnh. Không có số độ, không có cảm biến trên xe. | Cao | Bắt chọn một nhóm khi đăng. Không ghi nhiệt độ thực. | - [ ] Nhóm nhiệt khớp loại hàng thật. - [ ] Hai bên hiểu đây là nhóm hàng, không phải biên bản nhiệt độ. |
| A1-02 | Mô tả hàng, số tấn, số khối, số kiện lệch với hàng sẽ lên xe. Trọng lượng, thể tích và số kiện không bắt buộc. | Cao | Bắt mô tả hàng. Các số lượng kia có thể bỏ trống. | - [ ] Mô tả đủ để nhà xe biết xếp được không. - [ ] Số kiện và trọng lượng được ghi nếu cần đối chiếu lúc lấy. |
| A1-03 | Ảnh hàng không phải hàng sẽ chở, hoặc ảnh thiếu. Đơn mới cần 1–5 ảnh. Đơn cũ thiếu ảnh vẫn mở được. | Trung bình | Form tạo đơn đang bắt 1–5 ảnh. Giới hạn JPG, PNG, WebP, 2 MB/ảnh là giới hạn kỹ thuật tạm, chưa thành luật. | - [ ] Ảnh đúng hàng, đúng bao bì. - [ ] Nhà xe xem ảnh trước khi nhận. |
| A1-04 | Điểm lấy, điểm giao, người liên hệ, điện thoại hoặc cửa sổ giờ bị sai. Hàng lạnh không chờ được lâu ngoài xe. | Cao | Đơn lưu địa điểm, liên hệ và khung giờ. Không kiểm địa điểm có người nhận. | - [ ] Có người giao và người nhận trong khung giờ đã ghi. - [ ] Số điện thoại trên đơn gọi được. |
| A1-05 | Cước niêm yết do chủ hàng tự ghi. Số này là tiền cước của chuyến, không phải phí gói, không phải hoa hồng, không phải tiền đã thu. | Cao | Bắt số nguyên VND lớn hơn 0. Không có bước thương lượng giá trên sàn. | - [ ] Hai bên đồng ý đúng số trên đơn trước khi nhận chuyến. - [ ] Thỏa thuận miệng khác số trên đơn được xử lý ngoài hệ thống, vì chat không đổi cước. |
| A1-06 | Yêu cầu xe không khớp nhóm nhiệt (xe thường nhận đơn đông hoặc cực lạnh). | Cao | Có trường yêu cầu phương tiện dạng chữ. Không có máy đối chiếu loại xe với nhóm nhiệt. | - [ ] Nhà xe chỉ nhận khi xe của mình đủ máy lạnh cho nhóm đã ghi. |
| A1-07 | Đơn nằm sàn lâu vì không có máy ghép và không có máy điều phối. | Trung bình | Đơn ở **Đang tìm xe** cho đến khi một nhà xe tự nhận. | - [ ] Chủ hàng theo dõi đơn chưa có nhà xe. - [ ] Khung giờ lấy còn đủ nếu nhận muộn. |

### A2. Lúc nhận chuyến và phân công

| Mã | Rủi ro | Mức | Sản phẩm đang làm gì | Việc cần kiểm |
| --- | --- | --- | --- | --- |
| A2-01 | Hai nhà xe bấm nhận cùng một đơn. | Trung bình | Một nhà xe nhận được. Nhà xe kia bị từ chối. Chỉ nhà xe nhận được mới có khóa tỷ lệ hoa hồng của phía nhà xe. | - [ ] Nhà xe thấy từ chối thì không xếp xe cho đơn đó. - [ ] Chủ hàng chỉ thấy một nhà xe nhận. |
| A2-02 | Nhà xe nhận rồi không gán xe hoặc không gán tài xế. Đơn rời sàn nhưng chưa chạy. | Cao | Sau khi nhận, trạng thái dữ liệu là `MATCHED`. Chữ **Chờ lấy hàng** chỉ hiện khi đã gán đủ xe và tài xế. | - [ ] Gán đủ xe đang dùng và tài xế đang mở trước giờ lấy. - [ ] Chủ hàng thấy phân công trên đơn của mình. |
| A2-03 | Gán xe đang bận chuyến khác. Một xe chỉ được một chuyến chưa xong. | Trung bình | Lệnh gán sau nhận lỗi xe đang bận. Chuyến chưa xong gồm đơn nháp, đã nhận, đã xác nhận lấy, đang chở, và trạng thái sự cố trong dữ liệu. | - [ ] Xe được chọn không còn chuyến mở. - [ ] Không dùng cùng một xe cho hai đơn còn dang dở. |
| A2-04 | Gán tài xế không thuộc nhà xe đó, hoặc dùng chung một tài khoản tài xế cho nhiều người. | Cao | Phân công chỉ nhận xe và tài xế cùng nhà xe. Tài xế do nhà xe tạo bằng tên đăng nhập và mật khẩu. Lần đăng nhập đầu không bắt đổi mật khẩu. | - [ ] Đúng người lái được gán. - [ ] Mật khẩu tài xế không dùng chung. - [ ] Tài xế tự đổi mật khẩu nếu mật khẩu khởi tạo đã lộ. |
| A2-05 | Không đổi tài xế ở bước lấy hàng. Xe hỏng hoặc tài xế nghỉ sau khi đã gán thì luồng bấm thường không có nút thay. | Cao | Đã chốt: nhà xe không bấm thay tài xế ở bước lấy hàng. Chưa có luồng hủy đơn. | - [ ] Xe và tài xế chắc chắn đi được trước khi gán. - [ ] Nếu phải đổi, ghi nhận ngoài hệ thống và báo sự cố. Đừng coi là đã có nút đổi trên màn hình. |
| A2-06 | Nhà xe hết hạn gói hoặc quá trần xe sau khi đã nhận. | Trung bình | Quá trần thì không nhận thêm chuyến mới. Chuyến đã nhận vẫn phân công, lấy hàng, gửi vị trí và giao. Hết gói trả phí thì tài khoản về Free. Không tự trừ tiền gia hạn. | - [ ] Chuyến đã nhận vẫn được đi tiếp. - [ ] Không nhận chuyến mới khi màn hình báo quá hạn mức. |
| A2-07 | Mất mạng ngay sau khi bấm nhận. | Trung bình | Nhận chuyến cần một kết quả. Bấm lại không được tạo hai nhà xe trên cùng đơn. | - [ ] Tải lại danh sách chuyến của tôi trước khi nhận đơn khác. - [ ] Không xếp hai đội cho cùng một mã đơn. |

### A3. Lúc lấy hàng

| Mã | Rủi ro | Mức | Sản phẩm đang làm gì | Việc cần kiểm |
| --- | --- | --- | --- | --- |
| A3-01 | Tài xế bấm đã lấy khi hàng chưa lên xe, chưa đếm kiện, hoặc chưa đóng cửa thùng. | Cao | Nút xác nhận lấy chuyển đơn sang **Đang vận chuyển**. Không có vai kho để đồng kiểm. Vai kho chưa được bật. | - [ ] Đếm kiện, đối chiếu mô tả và ảnh. - [ ] Chỉ bấm lấy khi hàng đã ở trên xe và cửa thùng đã đóng. |
| A3-02 | Hàng không đúng nhóm nhiệt, bao bì ướt, rách, hoặc trộn hàng thường với hàng lạnh. | Cao | Không có cảm biến. Sự cố hàng hóa hoặc nhiệt độ là hồ sơ chữ, không tự dừng chuyến. | - [ ] Từ chối xếp nếu hàng không còn trong nhóm đã đăng, và báo sự cố loại hàng hóa hoặc nhiệt độ. - [ ] Không mở cửa thùng lâu hơn mức cần để đóng hàng. |
| A3-03 | Không có người giao hàng, kho đóng cửa, hoặc sai địa điểm lấy. | Cao | Có loại sự cố lấy hoặc giao hàng. Không có nút hủy chuyến trên luồng thường. | - [ ] Gọi người liên hệ trên đơn trước khi kết luận vắng mặt. - [ ] Báo sự cố lấy/giao. - [ ] Không bấm đã lấy nếu hàng chưa bàn giao. |
| A3-04 | Thiếu biên bản bàn giao. Ảnh lúc tạo đơn không phải ảnh lúc lấy. | Trung bình | Ảnh hàng nằm ở bước tạo đơn. Ảnh sự cố là tùy chọn. Chưa có tải chứng từ giao nhận. | - [ ] Nếu cần bằng chứng lúc lấy, ghi vào mô tả sự cố hoặc lưu chứng từ ngoài hệ thống. - [ ] Đừng coi ảnh đăng đơn là ảnh đã bàn giao. |

### A4. Đang vận chuyển

| Mã | Rủi ro | Mức | Sản phẩm đang làm gì | Việc cần kiểm |
| --- | --- | --- | --- | --- |
| A4-01 | Đứt lạnh trên đường: máy lạnh hỏng, hết nhiên liệu máy lạnh, cửa thùng hở, xếp sai nhóm. | Cao | Sự cố loại nhiệt độ là hồ sơ riêng. Tạo sự cố không đổi trạng thái chuyến, không tắt GPS, không hủy chuyến, không tạm giữ hoa hồng. Không có cảm biến gắn xe. | - [ ] Tài xế dừng xe an toàn rồi mới báo. - [ ] Nhà xe tiếp nhận hồ sơ. - [ ] Chủ hàng đọc sự cố trên đơn của mình. - [ ] Việc có chạy tiếp hay không là quyết định của hai bên, không phải nút trên hệ thống. |
| A4-02 | Xe hỏng, tai nạn, nổ lốp, không đi tiếp được. | Cao | Có loại sự cố phương tiện. Cùng quy tắc: chuyến không tự thành trạng thái sự cố. | - [ ] Báo sự cố phương tiện. - [ ] Báo vị trí cuối và tình trạng hàng. - [ ] Không có luồng gán xe thay trong bản này. |
| A4-03 | Chậm so với khung giờ giao: kẹt đường, thời tiết, cân, hải quan, cấm tải. | Trung bình | Có loại sự cố chậm trễ. Không có SLA giờ đến và không hứa trực 24/7. | - [ ] Báo chậm sớm, ghi lý do trong mô tả. - [ ] Chủ hàng báo lại người nhận. |
| A4-04 | Mất vị trí: tài xế không gửi GPS, điện thoại hết pin, mất sóng, hoặc tắt trình duyệt. | Cao | Tài xế gửi vị trí khi đang chở. Chưa có ứng dụng điện thoại riêng. Bản đồ cần token Mapbox mới hiện marker. | - [ ] Tài xế gửi vị trí trong lúc chở. - [ ] Khi bản đồ trống, đọc giờ và tọa độ nếu còn. Không suy ra là xe mất tích chỉ vì marker chưa vẽ. - [ ] Hết vị trí mới trong thời gian dài thì báo sự cố. |
| A4-05 | Vị trí GPS bị hiểu là đã lấy hàng hoặc đã giao. | Cao | Đã chốt: GPS không thay nút xác nhận. | - [ ] Chỉ coi lấy hàng và giao hàng khi có mốc xác nhận trên dòng thời gian. |
| A4-06 | Hàng hư, thiếu, nhiễm mùi, hoặc rò trong thùng giữa đường. | Cao | Có loại sự cố hàng hóa. Không có bước niêm phong trong hệ thống. | - [ ] Báo sự cố hàng hóa, mô tả kiện nào. - [ ] Giữ nguyên hiện trường trong mức an toàn, không tự sửa số kiện trên đơn. |
| A4-07 | Tài xế thao tác trên điện thoại khi đang lái. | Cao | Form sự cố là form chữ. Tài liệu sự cố yêu cầu dừng xe an toàn trước khi thao tác. | - [ ] Chỉ bấm lấy, giao, chat, GPS và sự cố khi xe đã dừng an toàn. |
| A4-08 | Hết dầu xe hoặc giá dầu tăng. Widget dầu không liên quan mức tiêu hao của xe. | Thấp | Giá Brent/WTI và giá trần diesel không đổi cước, gói, hoa hồng hay thù lao tài xế. Không có sổ đổ dầu. | - [ ] Nhà xe tự lo nhiên liệu cho chuyến đã nhận. - [ ] Không lấy số trên widget để đòi đổi cước niêm yết. |
| A4-09 | Chat đứt hoặc nhắn nhầm nhà xe. | Trung bình | Chủ hàng mở chat với nhà xe đã nhận. Chưa có nhà xe thì máy chủ từ chối. Việc chat lưu lâu dài chưa được kết luận nghiệm thu xong. | - [ ] Nội dung cần lưu (đổi giờ, đổi điểm) được nhắc lại trên đơn hoặc sự cố, không chỉ trong một tin nhắn. |

### A5. Lúc giao hàng

| Mã | Rủi ro | Mức | Sản phẩm đang làm gì | Việc cần kiểm |
| --- | --- | --- | --- | --- |
| A5-01 | Giao sai điểm, sai người, ngoài giờ, hoặc người nhận từ chối. | Cao | Có loại sự cố lấy hoặc giao hàng. Không có vai kho bên nhận để bấm đồng kiểm. | - [ ] Gọi đúng số trên đơn. - [ ] Không bấm đã giao nếu người nhận chưa nhận hàng. - [ ] Hàng bị từ chối thì báo sự cố, giữ mô tả. |
| A5-02 | Tài xế bấm đã giao khi hàng chưa tới nơi. | Cao | Chỉ tài xế được gán, khi đang vận chuyển, mới xác nhận giao. Gửi lại không tạo thêm mốc. Chủ hàng không có nút xác nhận đã nhận. | - [ ] Chủ hàng đối chiếu dòng thời gian với người nhận thực tế. - [ ] Lệch thì mở sự cố, không sửa mốc cũ. |
| A5-03 | Giao một phần, giao thừa, hoặc phải chở hàng trả về. | Cao | Không có trạng thái giao một phần và không có luồng hàng hoàn. | - [ ] Ghi số kiện thực nhận vào sự cố loại hàng hóa hoặc lấy/giao. - [ ] Không coi một nút giao là đã giao đủ bộ. |
| A5-04 | Không có chứng từ giao nhận trên hệ thống. | Trung bình | Xác nhận giao là một mốc. Chưa có tải chứng từ. | - [ ] Nếu hợp đồng đòi phiếu giao, lưu phiếu đó ngoài Coldi. - [ ] Mốc trên dòng thời gian là xác nhận của tài xế, không phải chữ ký người nhận. |
| A5-05 | Hai bên tưởng xác nhận giao là đã trả cước. | Cao | Dòng thời gian ghi rõ xác nhận giao chưa phải thanh toán. Bản đang chạy không thu tiền. | - [ ] Cước và phí dịch vụ được thu theo thỏa thuận ngoài hệ thống. - [ ] Không gửi ảnh màn hình xác nhận giao như chứng từ đã thu tiền. |
| A5-06 | Hàng đã tới nơi nhưng chủ hàng không trả cước cho nhà xe. | Cao | Coldi không thu hộ cước lúc giao, không ghi “đã thu” hay “chưa thu”, và không chặn nút giao khi chưa có tiền. Xác nhận giao vẫn diễn ra nếu tài xế bấm. | - [ ] Trước khi nhận chuyến, hai bên chốt ai trả, trả lúc nào, trả bằng cách nào. - [ ] Nhà xe không coi nút đã giao là biên lai thu tiền. - [ ] Nếu hẹn trả khi giao, nhà xe tự đối chiếu ngoài hệ thống trước khi cho tài xế bấm đã giao. |

### A6. Sự cố gắn với chuyến

Sáu loại đã chốt: nhiệt độ, phương tiện, chậm trễ, hàng hóa, lấy hoặc giao hàng, loại khác.

Ai được báo: chủ hàng trên đơn của mình, nhà xe trên đơn mình đã nhận, tài xế trên chuyến đang được gán. Nhà xe phản hồi tuyến đầu. Quản trị chỉ xử lý khi sự cố được chuyển cấp. Không hứa thời gian phản hồi cứng.

| Mã | Rủi ro | Mức | Sản phẩm đang làm gì | Việc cần kiểm |
| --- | --- | --- | --- | --- |
| A6-01 | Sự cố được mở nhưng chuyến vẫn chạy và hoa hồng không bị giữ. | Cao | Đã chốt: tạo sự cố không đổi chuyến, không dừng GPS, không hủy, không tạm giữ hoa hồng. | - [ ] Người xử lý nói rõ bằng lời: chuyến tiếp tục, dừng, hay chờ. - [ ] Không chờ hệ thống tự dừng xe trên phần mềm. |
| A6-08 | Có sự cố trên đường, hàng vẫn được giao, rồi chủ hàng từ chối trả một phần hoặc toàn bộ cước. | Cao | Sự cố không tự giảm cước niêm yết và không tự giữ khoản phải trả. Chưa có bước thu tiền, hoàn tiền hay phạt. Tranh chấp tiền sau giao còn mở. | - [ ] Ghi sự cố trước khi bàn khoản trừ. - [ ] Số cước trên đơn giữ nguyên cho đến khi hai bên có thỏa thuận ngoài hệ thống. - [ ] Không chờ Coldi trừ tiền hộ hoặc chi trả bù. |
| A6-02 | Báo trùng vì mạng chập. | Thấp | Cần một hồ sơ cho một lần gửi. Gửi lại không được tạo hai sự cố giống hệt chỉ vì bấm lại. | - [ ] Tải lại danh sách sự cố trước khi viết báo cáo mới. |
| A6-03 | Người không liên quan đọc được hồ sơ, hoặc chủ hàng thấy ghi chú nội bộ. | Cao | Mỗi vai chỉ thấy hồ sơ mình có quyền. Máy người dùng không được tự khai vai người báo. | - [ ] Nhà xe khác và chủ hàng khác không mở được sự cố. - [ ] Ghi chú chỉ dành cho nhà xe thì không viết vào phần chủ hàng đọc được. |
| A6-04 | Có kết quả xử lý nhưng người bị ảnh hưởng chưa đồng ý. | Trung bình | **Đã có kết quả** chưa phải **Đã đóng**. Phản đối đưa hồ sơ về **Đang xử lý** và có lịch sử. | - [ ] Đọc kết quả trước khi coi vụ việc xong. - [ ] Chưa đồng ý thì phản đối, không mở một hồ sơ mới để tranh. |
| A6-05 | Sự cố chưa đóng sau khi đã giao. | Trung bình | Giao hàng không tự đóng sự cố. | - [ ] Hồ sơ còn mở được theo đến khi có kết quả và được đóng theo quyền đang có. |
| A6-06 | Cần chuyển cấp cho quản trị mà không có người trực. | Cao | Chuyển cấp là chiều riêng, không ghi đè trạng thái chính. Khu `/admin` chưa phải chỗ làm việc hằng ngày. Cửa chuyển cấp qua HTTP đang bị từ chối. Không hứa trực 24/7. | - [ ] Nhà xe xử lý tuyến đầu bằng hồ sơ và chat. - [ ] Việc chuyển cấp được coi là còn khóa cho đến khi có luật và có người được chỉ định. |
| A6-07 | Cần đính kèm bằng chứng không phải chữ. | Trung bình | Form chữ là đủ. Ảnh là tùy chọn. File không phải ảnh nằm sau bản này. Dung lượng ảnh sự cố còn mở. | - [ ] Viết đủ sự việc trong mô tả. - [ ] Ảnh chỉ là bổ sung, không thay mô tả. |

### A7. Sau khi giao

| Mã | Rủi ro | Mức | Sản phẩm đang làm gì | Việc cần kiểm |
| --- | --- | --- | --- | --- |
| A7-01 | Hoa hồng chuyển từ ước tính sang đã ghi nhận lúc giao, trong khi tiền chưa thu. Chủ hàng hoặc nhà xe không trả phí dịch vụ cho Coldi. | Cao | Khóa tỷ lệ chủ hàng lúc đăng. Khóa tỷ lệ nhà xe lúc nhận. Giao xong thì từng bên sang đã ghi nhận. Không có bước tự động sang đã thu. Không có nhắc nợ, không có khóa tài khoản vì chưa trả. Màn hình phải nói đây là mô phỏng. | - [ ] Đọc đúng trạng thái ước tính hoặc đã ghi nhận. - [ ] Không cộng số đó vào doanh thu đã thu. - [ ] Phí dịch vụ chưa thu được theo dõi ngoài sổ, cho đến khi có cổng thanh toán. |
| A7-02 | Muốn hủy chuyến sau khi đã nhận hoặc đã lấy. | Cao | Luồng bấm thường không có nút hủy. Hủy phí trên sổ khi hủy chuyến chưa làm, vì chưa có luồng hủy được duyệt. Cửa sổ được phép hủy còn mở. | - [ ] Chưa nhận thì chủ hàng xử lý theo thỏa thuận ngoài hệ thống, vì chưa có nút hủy. - [ ] Đã nhận hoặc đã lấy thì báo sự cố và thỏa thuận ngoài hệ thống. - [ ] Không tự sửa tỷ lệ đã khóa. |
| A7-03 | Tranh chấp cước, hàng hư, giao thiếu sau khi đã ghi nhận phí. | Cao | Sau giao có thể tạm giữ từng bên khi đã được phép. Sửa số là một dòng mới, dòng gốc không bị viết lại. Cửa tạm giữ và điều chỉnh qua HTTP chưa làm. Ngưỡng tiền cần duyệt còn mở. | - [ ] Giữ hồ sơ sự cố và dòng thời gian. - [ ] Khoản chỉnh được ghi thành dòng mới khi có luật, không sửa dòng cũ. |
| A7-04 | Đổi gói sau khi đơn đã đăng hoặc đã nhận, rồi đòi tính lại phí chuyến cũ. | Trung bình | Đổi gói không sửa hai tỷ lệ đã khóa. Gói đang dùng giữ giá và tỷ lệ đã lưu. | - [ ] Chuyến cũ giữ đúng tỷ lệ lúc đăng và lúc nhận. - [ ] Chuyến mới dùng gói đang có hiệu lực. |

### A8. Có đơn nhưng không có xe, và có xe nhưng không có đơn

Không có máy ghép đơn với xe. Đơn nằm chờ nhà xe tự nhận. Xe chỉ chạy khi nhà xe nhận một đơn rồi gán đúng xe đó. Hai phía lệch nhau là việc thường gặp, và hệ thống không tự cân.

| Mã | Rủi ro | Mức | Sản phẩm đang làm gì | Việc cần kiểm |
| --- | --- | --- | --- | --- |
| A8-01 | Có đơn nhưng không có xe. Đơn ở **Đang tìm xe**, hoặc đã có nhà xe nhận nhưng chưa có xe để chạy. | Cao | Đơn chờ đến khi một nhà xe tự nhận. Không tìm xe theo nhóm nhiệt, tải trọng hay khung giờ. Xe đang bận một chuyến chưa xong thì không gán thêm. Nhà xe quá trần xe thì không nhận đơn mới. Nhận rồi mà chưa gán thì đơn đã rời sàn nhưng vẫn chưa có xe. | - [ ] Chủ hàng thấy **Đang tìm xe** thì hiểu là chưa có xe, không phải đang được điều phối. - [ ] Hết khung giờ lấy mà vẫn chưa có xe thì chủ hàng quyết định giữ hay bỏ đơn ngoài hệ thống, vì chưa có nút hủy. - [ ] Nhà xe chỉ nhận khi còn xe rảnh, đúng nhóm nhiệt, và còn trong trần gói. - [ ] Đơn đã nhận phải được gán xe và tài xế trước giờ lấy. |
| A8-02 | Có xe nhưng không có đơn. Xe lạnh đang rảnh, đúng nhóm nhiệt, còn trong trần, có tài xế, nhưng sàn không có đơn phù hợp về tuyến, nhóm nhiệt, khung giờ hoặc cước. | Trung bình | Sàn chỉ liệt kê đơn **Đang tìm xe**. Không đẩy đơn cho xe, không giữ chỗ cho xe đang chờ, không cảnh báo xe nằm không. Xe không có đơn thì không phát sinh cước và không phát sinh hoa hồng. | - [ ] Nhà xe tự mở sàn và lọc theo nhóm nhiệt, điểm lấy, điểm giao. - [ ] Không coi việc đã khai xe là sẽ có hàng. - [ ] Xe nằm không thì nhà xe tự chịu chi phí xe, không có khoản bù trên Coldi. |
| A8-03 | Trong bãi có xe nhưng hệ thống không cho xe đó nhận đơn. | Cao | Một xe chỉ một chuyến chưa xong. Xe đã lưu trữ không tính vào trần và không được gán. Quá trần thì không nhận chuyến mới. Gán xe vẫn cần một tài xế đang mở của cùng nhà xe. | - [ ] Xe còn gắn chuyến chưa giao xong thì không nhận đơn khác, dù xe đang đậu. - [ ] Muốn dùng xe đã lưu trữ thì khôi phục khi còn chỗ trong trần. - [ ] Có xe mà không có tài xế đang mở thì đơn vẫn chưa chạy được. |
| A8-04 | Đơn đang chạy mất xe giữa đường và không có xe thay trên luồng. | Cao | Sự cố phương tiện không gán xe khác và không đưa đơn trở lại sàn. Không có nút đổi xe ở bước lấy hàng. | - [ ] Báo sự cố phương tiện. - [ ] Không coi một xe khác trong đội là đã được gắn vào đơn. - [ ] Hai bên thỏa thuận xe thay ngoài hệ thống, rồi ghi vào hồ sơ sự cố. |

### A9. Liên hệ nhiều vòng nhưng không chốt, và hủy lặp

| Mã | Rủi ro | Mức | Sản phẩm đang làm gì | Việc cần kiểm |
| --- | --- | --- | --- | --- |
| A9-01 | Hai bên liên hệ nhiều vòng nhưng không chốt đơn. Hàng lạnh nằm chờ trong lúc bàn giá, giờ hoặc loại xe. | Cao | Trước khi nhận, nhà xe đã đăng nhập thấy số điện thoại và người liên hệ của điểm lấy, điểm giao. Chat chỉ mở sau khi một nhà xe đã nhận. Chat không đổi cước. Chưa có nút hủy để kết thúc vòng bàn. | - [ ] Coi đơn còn **Đang tìm xe** là chưa chốt. - [ ] Coi đơn đã nhận nhưng chưa gán xe và tài xế là chưa thành chuyến chạy. - [ ] Không lấy tin nhắn hoặc cuộc gọi làm bằng chứng đã nhận chuyến. |
| A9-02 | Hủy, đăng lại, nhận rồi bỏ, lặp nhiều lần để dò giá hoặc giữ chỗ. | Cao | Luồng thường không có nút hủy. Mỗi lần nhận vẫn khóa tỷ lệ hoa hồng của nhà xe trên sổ mô phỏng. Hủy phí khi hủy chuyến chưa làm. Cửa sổ được phép hủy còn mở. | - [ ] Theo dõi đơn đăng rồi biến mất, và đơn nhận rồi không được gán. - [ ] Không để một tài khoản chiếm sàn bằng cách nhận rồi bỏ. - [ ] Chuyến đã lấy hàng không bị kéo vào vòng hủy này. |

---

## Phần B — Rủi ro nghiệp vụ của cả hệ thống

Phần này không gắn một chuyến. Dùng khi rà sàn, tiền, gói, tài khoản, dữ liệu và những việc Coldi chưa làm.

### B1. Sàn và vai trò

| Mã | Rủi ro | Mức | Sản phẩm đang làm gì | Việc cần kiểm |
| --- | --- | --- | --- | --- |
| B1-01 | Cả sàn lệch một lúc: nhiều đơn không có xe, và nhiều xe không có đơn. | Cao | Không có máy ghép, không có máy gán xe, không có điều phối viên. Đơn và xe không tự gặp nhau. Bốn vai đang bật: chủ hàng, nhà xe, tài xế, quản trị. | - [ ] Rà cùng lúc hai danh sách: đơn **Đang tìm xe**, và xe đang dùng mà không gắn chuyến chưa xong. - [ ] Chủ hàng không chờ hệ thống tìm xe hộ. - [ ] Nhà xe không chờ hệ thống giao đơn cho xe đang rảnh. |
| B1-02 | Một tài khoản một vai. Nhầm phiên là nhầm quyền. | Trung bình | Đổi vai bằng cách đăng xuất rồi đăng nhập tài khoản kia. Sai vai thấy không có quyền. | - [ ] Mỗi người dùng đúng tài khoản của vai mình. - [ ] Không gửi mật khẩu tài xế cho chủ hàng. |
| B1-03 | Quản trị đăng nhập được nhưng chưa có bàn việc hằng ngày. | Cao | `/admin` chưa mở thành nơi xử lý đơn, đội xe, GPS, chat. Quản trị không mặc định đọc toàn bộ dữ liệu doanh nghiệp. | - [ ] Đừng hứa với khách là có tổng đài nội bộ trên hệ thống. - [ ] Sự cố vẫn do nhà xe xử lý tuyến đầu. |
| B1-04 | Chưa có vai kho, chưa có nhiều chi nhánh, chưa có nhiều người trong một công ty. Gói gắn từng tài khoản. | Trung bình | Điểm lấy và điểm giao gọi là kho theo nghĩa địa điểm. Đó không phải tài khoản. | - [ ] Một cửa hàng nhiều kho vẫn dùng một tài khoản chủ hàng trong bản này. - [ ] Không cấp tài khoản kho để đồng kiểm. |
| B1-05 | Sàn cho nhà xe đã đăng nhập thấy số điện thoại và người liên hệ của điểm lấy, điểm giao trên đơn đang tìm xe. | Trung bình | Đó là dữ liệu liên hệ của đơn đã đăng, không phải email đăng nhập. | - [ ] Chủ hàng chỉ ghi số của người trực điểm lấy và điểm giao. - [ ] Không ghi số cá nhân không liên quan đến chuyến. |
| B1-06 | Thỏa thuận trong chat lệch cước niêm yết. | Cao | Chat không nhận chuyến và không đổi giá. | - [ ] Cước dùng để tính phí dịch vụ là cước niêm yết trên đơn. - [ ] Số khác trong chat không được hiểu là đã sửa đơn. |

### B2. Cước, hoa hồng, tiền

Hai khoản tách nhau: phí của chủ hàng và phí của nhà xe. Cùng một cước niêm yết. Mỗi bên làm tròn riêng tới 1 VND, phần lẻ từ 0,5 thì lên 1. Không làm tròn một lần trên tổng.

Tỷ lệ đang công bố nằm ở bảng gói trong [mô tả luồng](00_MO_TA_DU_AN_VA_LUONG.md). Ví dụ chủ hàng Free là 5%, nhà xe Free là 5%. Cộng hai phí sau khi mỗi phí đã tròn. Bản này không thu khoản đó.

| Mã | Rủi ro | Mức | Sản phẩm đang làm gì | Việc cần kiểm |
| --- | --- | --- | --- | --- |
| B2-01 | Người dùng cộng cước niêm yết với phí gói, hoặc coi hoa hồng là tiền Coldi đã thu. | Cao | Ba số khác nhau: cước chuyến, phí gói, hoa hồng. Hoa hồng có trạng thái ước tính và đã ghi nhận. Không có trạng thái đã thu trên luồng tự động. | - [ ] Màn hình và câu trả lời cho khách nói rõ mô phỏng. - [ ] Không xuất số liệu này thành hóa đơn. |
| B2-02 | Tính một phí trên tổng hai tỷ lệ rồi mới làm tròn, ra số lệch từng đồng. | Trung bình | Mỗi bên tròn riêng, rồi mới cộng. | - [ ] Đối soát đúng cách nửa lên của từng bên. - [ ] Không làm tròn trên tổng rồi chia lại. |
| B2-03 | Khóa tỷ lệ sai thời điểm: chủ hàng phải khóa lúc đăng thành công, nhà xe lúc nhận thành công. | Cao | Đã có mã mô phỏng cho hai mốc này. | - [ ] Đơn đăng xong giữ đúng gói chủ hàng lúc đó. - [ ] Nhà xe nhận xong giữ đúng gói nhà xe lúc đó. |
| B2-04 | Giao lặp hoặc gọi lại API làm ghi phí hai lần. | Cao | Gửi lại xác nhận giao không tạo thêm mốc. Sổ không được ghi trùng. | - [ ] Một chuyến, mỗi bên một lần sang đã ghi nhận. - [ ] Bấm lại nút giao không tăng phí. |
| B2-05 | Hủy hợp lệ trước giao nhưng sổ vẫn còn ước tính. | Cao | Luật: hủy hợp lệ trước giao thì phần ước tính được hủy trên sổ. Việc này chưa làm vì chưa có luồng hủy được duyệt. | - [ ] Không báo khách là phí đã được hủy trên sổ nếu chuyến không có đường hủy. |
| B2-06 | Sự cố bị dùng để xóa phí hoặc để giữ tiền. | Trung bình | Sự cố không tự tạm giữ và không tự xóa phí. | - [ ] Muốn giữ hoặc sửa thì chờ luật tạm giữ. - [ ] Không xóa dòng gốc. |
| B2-07 | Bật thu tiền thật khi cổng thanh toán chưa có. | Cao | Thanh toán production không hoạt động. Không trừ tiền gói, không thu hoa hồng, không chi trả, không hoàn tiền, không hóa đơn VAT. | - [ ] Môi trường đang chạy từ chối kích hoạt gói trả phí nếu không phải Demo hoặc QA được cấp phép. - [ ] Một biến môi trường đơn lẻ không đủ để bật đường thu tiền. |

### B3. Gói dịch vụ

| Mã | Rủi ro | Mức | Sản phẩm đang làm gì | Việc cần kiểm |
| --- | --- | --- | --- | --- |
| B3-01 | Gói trả phí hết hạn giữa lúc đang có chuyến. | Trung bình | Hết hạn thì về Free. Không tự gia hạn bằng cách trừ tiền. Chuyến đã nhận vẫn đi tiếp. Tỷ lệ đã khóa không đổi. | - [ ] Chủ tài khoản biết ngày hết hạn. - [ ] Chuyến mới sau khi về Free dùng tỷ lệ Free. |
| B3-02 | Nhà xe có nhiều xe đang dùng hơn trần gói hiện tại. | Trung bình | Trạng thái quá hạn mức: không nhận chuyến mới. Xe đã lưu trữ không tính vào trần. Chỉ lưu trữ xe khi xe không còn chuyến chưa xong. | - [ ] Đếm xe đang dùng, không đếm xe đã lưu trữ. - [ ] Muốn thêm xe thì còn chỗ trong trần, hoặc lưu trữ xe rảnh. |
| B3-03 | Hạ gói giữa kỳ rồi bị cắt quyền ngay. | Trung bình | Hạ gói tự nguyện có hiệu lực ở cuối kỳ. | - [ ] Trong kỳ đã trả, quyền của gói đó còn đến hết kỳ. |
| B3-04 | Hai lệnh thêm xe cùng lúc vượt trần. | Trung bình | Không vượt trần. Lỗi phải nói rõ là quá hạn mức gói. | - [ ] Trần Free 2 xe, Pro 10, Business 30, Enterprise nhà xe 100. Chủ hàng không có trần xe. |
| B3-05 | Kích hoạt gói trả phí ở bản thử bị hiểu là đã mua. | Cao | Website không thu tiền gói. Catalog giữ giá đã lưu trên gói đang dùng. Đổi catalog sau không viết lại gói cũ. | - [ ] Gói Demo/QA được ghi là bản thử. - [ ] Giá công khai lấy từ catalog hiện hành, không lấy số cũ trong tài liệu lịch sử. |
| B3-06 | Các việc còn mở bị đem ra làm quy định. | Trung bình | Còn mở: số đơn tối đa của chủ hàng, quyền lợi Premium, nâng gói giữa kỳ, tiền lẻ theo ngày, điều khoản riêng từng hợp đồng Enterprise. | - [ ] Không tự đặt hạn mức đơn. - [ ] Không tự tính tiền lẻ theo ngày. - [ ] Hợp đồng riêng chưa có trong sản phẩm thì chưa gắn vào gói. |

### B4. Tài khoản, dữ liệu, theo dõi

| Mã | Rủi ro | Mức | Sản phẩm đang làm gì | Việc cần kiểm |
| --- | --- | --- | --- | --- |
| B4-01 | Tài xế nhìn thấy chuyến của tài xế khác, hoặc nhà xe khác đọc đội xe, chat, GPS. | Cao | Tài xế chỉ thấy chuyến được gán. Nhà xe khác không đọc chuyến đã có chủ. Chat thuộc đúng cặp chủ hàng và nhà xe đã nhận. | - [ ] Thử bằng tài khoản không liên quan: phải bị từ chối, không thấy hàng và không thấy vị trí. |
| B4-02 | Chủ hàng đọc vị trí đơn của chủ hàng khác. | Cao | Vị trí đơn chỉ dành cho chủ hàng tạo đơn. | - [ ] Đường xem vị trí của đơn người khác bị từ chối. |
| B4-03 | Mật khẩu tài xế yếu vì nhà xe đặt hộ và không bắt đổi lần đầu. | Cao | Mật khẩu lưu dạng đã băm. Không bắt email. Tài khoản cũ đang dùng email vẫn đăng nhập trong thời gian chuyển. | - [ ] Mật khẩu khởi tạo đủ dài và giao riêng cho đúng tài xế. - [ ] Thu hồi tài khoản khi tài xế nghỉ, trước khi gán chuyến mới. |
| B4-04 | Ảnh hàng hoặc ảnh sự cố chứa mã độc, hoặc lưu quá lâu so với nhu cầu. | Trung bình | Ảnh đơn là JPG, PNG, WebP. Luật dung lượng ảnh sự cố còn mở. File không phải ảnh chưa làm. | - [ ] Chỉ nhận ảnh đúng loại đang cho phép. - [ ] Không mở rộng sang file tùy ý khi chưa có luật. |
| B4-05 | Nhật ký hệ thống không tra được khi tranh chấp. | Trung bình | Dòng thời gian trên đơn là mốc nghiệp vụ. Cửa tra nhật ký quản trị chưa được duyệt. | - [ ] Giữ mốc đăng, nhận, phân công, lấy, giao. - [ ] Sự cố giữ lịch sử từng bước. Không sửa sự kiện cũ. |
| B4-06 | Bản đồ trống bị hiểu là mất hàng. | Trung bình | Thiếu token Mapbox thì không vẽ marker giả. Tọa độ và thời điểm vẫn là dữ liệu gốc nếu GPS đã gửi. | - [ ] Đọc giờ quan sát của điểm GPS. - [ ] Phân biệt chưa cấu hình bản đồ với chưa có vị trí. |
| B4-07 | Giá dầu lỗi làm đứng cả việc đăng nhập, nhận chuyến, chat, GPS, lấy hàng, giao hàng. | Cao | Đã chốt: lỗi nguồn giá dầu không được làm hỏng các việc đó. Hết giá thì báo không có số, không điền 0. Dữ liệu cũ thì giữ giá hợp lệ cuối và nói rõ. | - [ ] Tắt nguồn giá dầu thử: vẫn đăng nhập và vẫn nhận chuyến được. - [ ] Màn hình không hiện 0 USD. |
| B4-08 | Đọc giá Brent/WTI hoặc giá trần diesel thành giá dầu tại cây xăng, hoặc thành căn cứ đổi cước. | Thấp | Brent và WTI là USD/thùng, có ngày quan sát của nguồn. Diesel trong nước là giá trần đã kiểm chứng, đơn vị VND/lít, chỉ khi quản trị đã công bố. Không phải giá cây xăng. | - [ ] Chữ trên màn hình giữ đơn vị và nguồn. - [ ] Không nói là giá thời gian thực. |

### B5. Những việc hệ thống chưa gánh

Các việc dưới đây nằm ngoài bản đang chạy. Rủi ro nằm ở chỗ khách hoặc nhóm vận hành tưởng đã có.

| Mã | Việc chưa có | Rủi ro nếu coi là đã có | Việc cần kiểm |
| --- | --- | --- | --- |
| B5-01 | Cổng thanh toán, trừ gói, thu hoa hồng, chi trả nhà xe, hoàn tiền, hóa đơn VAT | Thu thiếu, thu trùng, hoặc xuất chứng từ không có thật | - [ ] Mọi câu nói về tiền đều gắn chữ chưa thu trên bản này. |
| B5-02 | Tự ghép đơn, tự điều phối, tự gán xe | Đơn không có xe mà khách tưởng hệ thống đang tìm | - [ ] Chữ trên sàn là nhà xe tự chọn. |
| B5-03 | Cảm biến nhiệt, sổ đổ dầu, định mức nhiên liệu theo xe | Không có bằng chứng đứt lạnh khi tranh chấp hàng | - [ ] Hồ sơ nhiệt là lời kể trong sự cố, không phải log máy. |
| B5-04 | Đổi cước theo giá dầu | Đòi sửa `listedPriceVnd` vì widget dầu đổi | - [ ] Cước chuyến giữ nguyên sau khi đăng. |
| B5-05 | Ứng dụng iOS, Android, bộ cài máy tính | Tài xế mất GPS vì trình duyệt ngủ | - [ ] Hướng dẫn tài xế dùng trình duyệt và giữ phiên khi đang chở. |
| B5-06 | Khu quản trị vận hành đầy đủ | Không có người xem toàn mạng lưới khi có sự cố lớn | - [ ] Kế hoạch trực nằm ngoài sản phẩm cho đến khi khu quản trị được duyệt. |
| B5-07 | Bảo hiểm chuyến, giấy phép lái xe, đăng kiểm máy lạnh | Sàn không chứng minh xe đủ điều kiện pháp lý | - [ ] Nhà xe tự chịu điều kiện xe và người lái trước khi nhận. |
| B5-08 | Hàng cấm, hàng nguy hiểm, kiểm dịch | Đơn chữ không chặn loại hàng | - [ ] Chủ hàng không đăng hàng mà xe lạnh và pháp luật không được chở. |

### B6. Gian lận và lạm dụng

| Mã | Rủi ro | Mức | Sản phẩm đang làm gì | Việc cần kiểm |
| --- | --- | --- | --- | --- |
| B6-01 | Đơn ảo để giữ xe hoặc để tạo sổ hoa hồng mô phỏng. | Trung bình | Nhận đơn và giao đơn đều do người bấm. Sổ là mô phỏng, không thu tiền. | - [ ] Không dùng số đã ghi nhận để đòi thanh toán. - [ ] Đơn không có hàng thật thì không được đưa ra môi trường khách. |
| B6-02 | Nhận chuyến rồi bỏ, không gán xe, không báo. | Cao | Đơn rời sàn ngay khi nhận. Không có nút hủy cho chủ hàng kéo đơn về. | - [ ] Có việc theo dõi đơn đã nhận nhưng chưa sang chờ lấy hàng. - [ ] Nhà xe báo sự cố nếu không đi được. |
| B6-03 | Xác nhận giao khống. | Cao | Hệ thống tin nút của tài xế được gán. Không đối soát với người nhận. | - [ ] Với chuyến thật, có đối chiếu ngoài hệ thống. - [ ] Mốc giao một lần là đủ để ghi nhận phí mô phỏng. |
| B6-04 | Ảnh đăng đơn không phải hàng lên xe. | Trung bình | Nhà xe thấy ảnh. Không có bước đối chiếu ảnh lúc lấy. | - [ ] Nhà xe so ảnh với hàng trước khi bấm nhận và trước khi tài xế bấm lấy. |
| B6-05 | Vượt trần xe bằng cách khôi phục xe đã lưu trữ hoặc tạo xe song song. | Trung bình | Khôi phục và thêm xe phải còn chỗ trong trần. Hai lệnh thêm xe không được vượt trần. | - [ ] Đếm lại xe đang dùng sau khi khôi phục. |
| B6-06 | Dùng tài khoản tài xế để vào sàn nhận chuyến hoặc sửa sổ. | Trung bình | Tài xế không mua gói, không tự nhận chuyến, không sửa sổ hoa hồng. | - [ ] Tài xế chỉ thấy chuyến được gán. |

---

## Phần C — Việc cần rà trước khi gọi là vận hành thật

Các dòng dưới là rủi ro cao mà bản đang chạy chưa chặn bằng một nút hoặc một luật đã duyệt. Đi hết danh sách này trước khi nhận hàng lạnh của khách ngoài nhóm thử.

| # | Việc | Vì sao còn rủi ro | Đã kiểm |
| --- | --- | --- | --- |
| 1 | Nhiệt độ thực của hàng | Chỉ có nhóm Lạnh mát / Đông / Cực lạnh và sự cố dạng chữ. Không có cảm biến. | - [ ] |
| 2 | Bàn giao lúc lấy và lúc giao | Không có vai kho, không có phiếu giao trên hệ thống, chủ hàng không bấm đã nhận. | - [ ] |
| 3 | Xác nhận giao khống | Một nút của tài xế là đủ để sang đã xác nhận giao và để ghi nhận hoa hồng mô phỏng. | - [ ] |
| 4 | Chuyến kẹt sau khi nhận | Không đổi tài xế ở bước lấy hàng. Không có nút hủy trên luồng thường. Có đơn mà không có xe để gán, hoặc xe hỏng mà không có xe thay. | - [ ] |
| 5 | Xe hỏng giữa đường | Sự cố không gán xe thay, không dừng chuyến, không dừng GPS. | - [ ] |
| 6 | Mất dấu GPS | Trình duyệt, pin, sóng, token bản đồ. Marker không phải bằng chứng giao hàng. | - [ ] |
| 7 | Tiền sau khi giao | Cước chủ hàng trả nhà xe, và phí dịch vụ từng bên trả Coldi, đều không được thu trên hệ thống. Giao xong vẫn có thể không được trả. Sự cố không tự trừ cước. | - [ ] |
| 8 | Hủy và tranh chấp | Hủy trên sổ, tạm giữ, điều chỉnh vẫn chờ luật. Sự cố không tự giữ phí. | - [ ] |
| 9 | Trực sự cố | Không SLA, không 24/7, chuyển cấp đang khóa, khu quản trị chưa phải chỗ làm việc. | - [ ] |
| 10 | Điều kiện xe và lái xe | Sàn không kiểm đăng kiểm, bảo hiểm, giấy phép. | - [ ] |
| 11 | Dữ liệu người khác | Thử chéo vai trước khi cho khách thật vào cùng một máy chủ. | - [ ] |
| 12 | Giá dầu | Widget không được làm đổi cước và không được làm đứng chuyến. | - [ ] |
| 13 | Lệch đơn và xe | Có đơn không có xe, và có xe không có đơn. Sàn không tự ghép. Xe bận, xe lưu trữ hoặc quá trần thì không lấy được đơn dù ngoài bãi vẫn thấy xe. | - [ ] |
| 14 | Hư xe và chậm hàng | Có hồ sơ sự cố phương tiện và chậm trễ. Chưa có gói bảo hiểm trong giá đang công bố. Mở sự cố không tự ra tiền. | - [ ] |
| 15 | Bàn không chốt, hủy lặp | Gọi được trước khi nhận vì số điện thoại nằm trên sàn. Nhận rồi có thể chat mãi mà không gán xe. Chưa có nút hủy và chưa có hạn số lần hủy. | - [ ] |

## Phần D — Ai kiểm tra điều gì

| Vai | Việc rà của vai đó |
| --- | --- |
| Chủ hàng | A1, A5-05, A7, A8-01, A9, B2-01, B5-08. Đơn còn **Đang tìm xe** là chưa có xe và chưa chốt. Đối chiếu người nhận sau khi thấy mốc giao. |
| Nhà xe | A2, A4, A5-06, A6, A6-08, A8, A9, B3, B6-02. Đếm xe rảnh trước khi nhận. Xe nằm không thì tự mở sàn. Chốt cách thu cước trước khi giao. Xử lý sự cố tuyến đầu. |
| Tài xế | A3, A4-04, A4-07, A5. Dừng xe rồi mới bấm. Không bấm lấy hoặc giao khi việc ngoài đời chưa xong. |
| Người chạy bản thử | B2-07, B4-01, B4-07, Phần C. Giữ chữ mô phỏng. Không bật thu tiền. |

Khi một dòng trong file này khác [mô tả dự án và luồng](00_MO_TA_DU_AN_VA_LUONG.md) về giá, hoa hồng, sự cố hoặc giá dầu, dùng file mô tả luồng.

## Phần E — Giả thuyết đang bàn

Phần này ghi những hướng đã bàn ngày 26/10/2026. Đây chưa phải luật, chưa có mã, và chưa đổi giá gói đang công bố. Nhà xe vẫn tự bấm nhận. Coldi không tự gán xe.

### E1. Lệch đơn và xe

| Mã | Giả thuyết | Việc giả thuyết này làm | Cần duyệt riêng |
| --- | --- | --- | --- |
| E1-01 | Cảnh báo khi sắp đến giờ lấy mà đơn vẫn **Đang tìm xe**. | Chủ hàng thấy chưa có xe. Đơn không tự hủy. | Không |
| E1-02 | Chủ hàng hủy được khi đơn còn **Đang tìm xe**. | Chưa có nhà xe thì chưa có phí phía nhà xe. Phí ước tính của chủ hàng được hủy trên sổ. | Có. Cửa sổ hủy còn mở. |
| E1-03 | Nhận rồi quá giờ lấy vẫn chưa gán xe và tài xế thì đơn về lại sàn. | Nhà xe đó hết quyền trên đơn và không nhận lại chính đơn ấy. Phí ước tính của nhà xe được hủy trên sổ. | Có |
| E1-04 | Nhà xe tự bật trạng thái đang chờ hàng, kèm nhóm nhiệt, tải và tuyến. | Chủ hàng thấy còn xe đang chờ. Nhà xe vẫn tự bấm nhận. Hết khung giờ thì tín hiệu tắt. | Có |
| E1-05 | Nhà xe lưu bộ lọc. Có đơn khớp thì được báo. | Màn hình tách hai câu: sàn không có đơn, và có đơn nhưng không khớp bộ lọc. Không tự nhận hộ. | Không, nếu chỉ là thông báo |
| E1-06 | Mỗi xe một lý do khi không nhận được đơn. | Bận chuyến nào, đang lưu trữ, đội quá trần, hoặc chưa có tài xế đang mở. Giữ một xe một chuyến chưa xong. | Không |
| E1-07 | Sự cố phương tiện đang mở thì nhà xe được gán xe khác của chính mình. | Xe mới không được đang bận. Đơn không về sàn. | Có. Bước lấy hàng đang không cho đổi tài xế. |
| E1-08 | Bảng đếm đơn đang tìm xe và xe rảnh, theo nhóm nhiệt. | Để nhìn chỗ lệch. Không nhận chuyến hộ và không hứa đang điều xe. | Không |

Khi mất xe giữa đường mà E1-07 chưa được duyệt: ghi sự cố phương tiện, hai bên tự chốt xe thay ngoài hệ thống. Xe thay không được coi là đã gán trên đơn.

### E2. Bảo hiểm hư xe và chậm hàng, gắn vào Pro trở lên

Free không có bảo hiểm. Pro tháng và Pro năm cùng một mức, vì năm chỉ là cách trả tiền gói. Gói cao hơn Pro thì quyền lợi dày hơn. Chủ hàng và nhà xe mỗi bên mang quyền lợi của chính mình. Một chuyến có thể lệch bậc.

| Bên | Free | Pro tháng và Pro năm | Bậc cao hơn |
| --- | --- | --- | --- |
| Chủ hàng | Không có | Chậm so với giờ giao đã ghi trên đơn. Chi một phần cước niêm yết. | Enterprise: cùng mốc chậm, trần cao hơn Pro. Thêm xét hàng hư vì giao trễ nếu hồ sơ nhiệt độ hoặc hàng hóa đã mở trước giờ giao. |
| Nhà xe | Không có | Hư xe khi đang chở. Chi cứu hộ và kéo xe, trần theo chuyến. | Business: thêm tiền sửa chữa có hóa đơn, trần cao hơn Pro. Enterprise: thêm chi phí xe thay cho đúng chuyến đang dở. Nhà xe vẫn tự sắp xe thay. |

Cách khóa giống hoa hồng. Chậm giao khóa lúc đăng đơn. Hư xe khóa lúc nhận chuyến. Nâng gói sau không làm chuyến cũ dày hơn. Hết hạn về Free thì chuyến đã khóa giữ mức cũ đến khi xong. Chuyến mới không còn bảo hiểm.

Phí bảo hiểm không cộng vào cước niêm yết và không đem tính hoa hồng. Mở sự cố không tự ra tiền. Bấm đã giao không phải biên lai bồi thường. Trần chi là một phần cước chuyến hoặc chi phí cứu hộ có hóa đơn. Giá trị hàng lạnh là hợp đồng khác.

Hướng để bàn với tiền: hãng bảo hiểm đã được cấp phép nhận rủi ro. Phí nằm trong giá gói hiện tại, hoặc giá gói được duyệt lại. Coldi giữ dữ liệu chuyến và hồ sơ sự cố. Coldi không tự trả tiền sửa xe hay tiền chậm hàng.

Chưa đền, kể cả khi tài khoản đang Pro: đơn còn **Đang tìm xe**, nhận rồi không gán xe, sai điểm lấy hoặc không có người nhận, tài xế bấm giao khi hàng chưa tới, và vụ không chốt đơn ở A9.

Số trần tiền chưa được đặt trong file này.

### E3. Không chốt đơn và hủy lặp

Vụ này đứng ngoài E2. Không chốt được đơn thì chưa có chuyến để bảo hiểm chi.

| Bước | Giả thuyết |
| --- | --- |
| Trước khi nhận | Sàn chỉ hiện điểm đi, điểm đến, nhóm nhiệt, khung giờ và cước. Số điện thoại chỉ hiện sau khi nhà xe bấm nhận. |
| Đã nhận, chưa gán xe | Chat trong khung giờ lấy đã ghi trên đơn. Hết giờ mà chưa gán đủ xe và tài xế thì xử lý theo E1-03. |
| Muốn giá khác | Lập đơn mới. Chat không sửa cước niêm yết. |
| Hủy lặp | Mỗi tài khoản có một số lần hủy trong kỳ gói. Free ít hơn Pro. Pro trở lên nhiều hơn. Enterprise nhiều nhất. Quá số thì ngừng đăng đơn mới hoặc ngừng nhận đơn mới đến hết kỳ. Chuyến đã lấy hàng vẫn chạy. Số cụ thể chưa được đặt. |
| Đã lấy hàng | Không dùng nút hủy. Việc trên đường chuyển sang hồ sơ sự cố. |

Chủ hàng hủy đơn của mình. Nhà xe bỏ đơn mình đã nhận. Một bên hủy không làm tiêu biến số lần của bên kia.
