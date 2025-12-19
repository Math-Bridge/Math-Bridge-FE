import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Chính Sách Bảo Mật
          </h1>
          <p className="text-gray-600">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Giới Thiệu</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Math Bridge ("chúng tôi", "của chúng tôi", hoặc "chúng ta") cam kết bảo vệ quyền riêng tư của bạn. Chính sách Bảo mật này giải thích cách chúng tôi thu thập, sử dụng, tiết lộ và bảo vệ thông tin của bạn khi bạn sử dụng nền tảng và dịch vụ dạy kèm trực tuyến của chúng tôi. Vui lòng đọc kỹ Chính sách Bảo mật này. Nếu bạn không đồng ý với các điều khoản của Chính sách Bảo mật này, vui lòng không truy cập Dịch vụ.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Thông Tin Chúng Tôi Thu Thập</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.1 Thông Tin Cá Nhân</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Chúng tôi có thể thu thập thông tin cá nhân mà bạn tự nguyện cung cấp cho chúng tôi khi bạn:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Đăng ký tài khoản (tên, địa chỉ email, số điện thoại từ 10-15 chữ số)</li>
              <li>Tạo hồ sơ (ảnh đại diện, vị trí địa lý, nền tảng giáo dục)</li>
              <li>Thực hiện thanh toán (địa chỉ thanh toán, thông tin thẻ thanh toán)</li>
              <li>Giao tiếp với chúng tôi (yêu cầu hỗ trợ, phản hồi)</li>
              <li>Tham gia các buổi học kèm (ghi âm buổi học, nếu có)</li>
              <li>Đăng nhập lần đầu (yêu cầu cập nhật vị trí địa lý)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.2 Thông Tin Trẻ Em (Children)</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Đối với trẻ em được thêm vào hệ thống bởi phụ huynh, chúng tôi thu thập:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Tên trẻ em, ngày sinh (không được trùng lặp trong cùng một tài khoản phụ huynh)</li>
              <li>Kết quả học tập và điểm kiểm tra (tất cả bài kiểm tra đều được ghi nhận vào hệ thống)</li>
              <li>Báo cáo tiến độ học tập và ghi chú buổi học</li>
              <li>Thông tin về trung tâm được gán (nếu có)</li>
              <li>Lịch sử hợp đồng và các buổi học</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Lưu ý:</strong> Phụ huynh phải chịu trách nhiệm cho tất cả các trẻ em mà họ thêm vào hệ thống. Phụ huynh không thể có 2 trẻ em với cùng tên và ngày sinh.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.3 Thông Tin Gia Sư (Tutor)</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Đối với gia sư sử dụng dịch vụ, chúng tôi thu thập:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Thông tin hồ sơ (phải cập nhật khi đăng nhập lần đầu)</li>
              <li>Mức lương theo giờ (được cập nhật bởi quản trị viên dựa trên hiệu suất)</li>
              <li>Thông tin về trung tâm được phân công</li>
              <li>Trạng thái xác minh (phải được nhân viên phê duyệt trước khi dạy)</li>
              <li>Báo cáo sau mỗi buổi học</li>
              <li>Lịch sử hợp đồng và buổi học</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.4 Thông Tin Tự Động Thu Thập</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Khi bạn truy cập Dịch vụ, chúng tôi có thể tự động thu thập một số thông tin, bao gồm:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Thông tin thiết bị (địa chỉ IP, loại trình duyệt, hệ điều hành)</li>
              <li>Dữ liệu sử dụng (trang đã truy cập, thời gian sử dụng, tính năng đã sử dụng)</li>
              <li>Cookies và các công nghệ theo dõi tương tự</li>
              <li>File log và dữ liệu phân tích</li>
              <li>Thông tin vị trí địa lý (để đảm bảo hợp đồng offline nằm trong phạm vi trung tâm)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Cách Chúng Tôi Sử Dụng Thông Tin Của Bạn</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Chúng tôi sử dụng thông tin thu thập được để:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Cung cấp, duy trì và cải thiện Dịch vụ của chúng tôi</li>
              <li>Xử lý giao dịch thanh toán và gửi thông tin liên quan</li>
              <li>Ghép học sinh với gia sư phù hợp (gia sư chính và gia sư dự phòng)</li>
              <li>Lên lịch và quản lý các buổi học kèm (đảm bảo 90% số buổi học được thực hiện)</li>
              <li>Quản lý hợp đồng và đảm bảo không có hợp đồng chồng chéo</li>
              <li>Xử lý yêu cầu đổi lịch và hoàn tiền khi cần thiết</li>
              <li>Gửi thông tin hành chính và cập nhật</li>
              <li>Phản hồi các yêu cầu của bạn và cung cấp hỗ trợ khách hàng</li>
              <li>Giám sát và phân tích các mẫu sử dụng và xu hướng</li>
              <li>Phát hiện, ngăn chặn và xử lý các vấn đề kỹ thuật và mối đe dọa bảo mật</li>
              <li>Phát hiện và xử lý các hành vi độc hại (có thể dẫn đến chấm dứt hợp đồng hoặc cấm tài khoản)</li>
              <li>Tuân thủ nghĩa vụ pháp lý và thực thi Điều khoản Dịch vụ của chúng tôi</li>
              <li>Báo cáo hàng tháng cho chủ sở hữu/cổ đông về hệ thống, nhân viên, gia sư</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.1 Service Providers</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may share information with third-party service providers who perform services on our behalf, such as:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Payment processing</li>
              <li>Video conferencing services</li>
              <li>Cloud storage and hosting</li>
              <li>Analytics and data analysis</li>
              <li>Email and communication services</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.2 Tutors and Parents</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              To facilitate tutoring services, we may share relevant information between:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Tutors and parents/students for session coordination</li>
              <li>Progress reports and educational assessments</li>
              <li>Communication necessary for service delivery</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.3 Legal Requirements</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may disclose your information if required to do so by law or in response to valid requests by public authorities.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.4 Business Transfers</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security assessments and updates</li>
              <li>Employee training on data protection</li>
              <li>Incident response procedures</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your information, we will securely delete or anonymize it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights and Choices</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request transfer of your data to another service</li>
              <li><strong>Objection:</strong> Object to processing of your personal information</li>
              <li><strong>Restriction:</strong> Request restriction of processing</li>
              <li><strong>Withdrawal of Consent:</strong> Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our Service is designed for use by students under the supervision of parents or guardians. We collect information about children only with parental consent and in accordance with applicable laws. Parents have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Review their child's personal information</li>
              <li>Request deletion of their child's information</li>
              <li>Refuse further collection or use of their child's information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to track activity on our Service and hold certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Third-Party Links</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our Service may contain links to third-party websites or services that are not owned or controlled by Math Bridge. We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. By using our Service, you consent to the transfer of your information to these facilities.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or wish to exercise your rights regarding your personal information, please contact us through the contact information provided on our platform or via email at the address listed in our Service.
            </p>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-8 border-t border-gray-200 flex justify-center">
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;

