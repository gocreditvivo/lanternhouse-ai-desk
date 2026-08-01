export type Language = 'en' | 'vi';

export const translations = {
  en: {
    // Nav
    nav: {
      features: 'Features',
      pricing: 'Pricing',
      howItWorks: 'How It Works',
      faq: 'FAQ',
      startTrial: 'Start Free Trial',
      login: 'Login',
      languageToggle: 'VI',
    },
    // Hero
    hero: {
      title: 'Never Miss a Call. Never Lose a Customer.',
      subtitle:
        'The AI receptionist that speaks English and Vietnamese — answers every call 24/7, books appointments, takes orders. Built for Vietnamese nail salons and restaurants.',
      ctaPrimary: 'Start 14-Day Free Trial',
      ctaSecondary: 'Hear a Sample Call',
      badge1: 'No Credit Card Required',
      badge2: 'Set Up in 5 Minutes',
      badge3: 'Cancel Anytime',
    },
    // Problem
    problem: {
      title: 'The Problem',
      items: [
        { title: '40% of calls go missed', desc: 'When you are busy with clients, the phone keeps ringing. Each missed call is a lost booking.' },
        { title: 'Language barrier', desc: 'Vietnamese-speaking customers cannot leave messages in their language. Communication breaks down.' },
        { title: 'Receptionist costs $2,500+/mo', desc: 'Hiring a bilingual receptionist is expensive. Most small salons and restaurants cannot afford one.' },
      ],
    },
    solution: {
      title: 'The Solution',
      items: [
        { title: 'AI answers every call instantly', desc: '24/7. Never miss a call, even after hours or during peak hours.' },
        { title: 'Speaks English and Vietnamese', desc: 'Auto-detects the callers language and responds fluently. No separate line needed.' },
        { title: 'Starts at $49/month', desc: 'No receptionist salary. No per-minute fees. One flat price, cancel anytime.' },
      ],
    },
    // How It Works
    howItWorks: {
      title: 'How It Works',
      steps: [
        { title: 'Forward Your Number', desc: 'Keep your existing phone number. Set the AI as your backup when you are busy, or let it handle all calls.' },
        { title: 'AI Answers and Books', desc: 'The AI greets callers in their language, answers questions, books appointments, and takes orders.' },
        { title: 'You Get the Booking', desc: 'Receive instant SMS with the booking details. Customer gets a confirmation text. Show up, serve the customer.' },
      ],
    },
    // Features
    features: {
      title: 'Everything You Need',
      items: [
        { icon: 'Languages', title: 'Bilingual EN/VI', desc: 'Auto-detects whether the caller speaks English or Vietnamese and responds fluently in that language.' },
        { icon: 'Clock', title: '24/7 Call Answering', desc: 'Never miss a call. The AI answers instantly, day or night, weekends and holidays.' },
        { icon: 'Calendar', title: 'Appointment Booking', desc: 'Captures name, service, preferred time, and technician. Sends SMS confirmation to the customer.' },
        { icon: 'UtensilsCrossed', title: 'Restaurant Phone Orders', desc: 'Takes full phone orders with menu items, modifiers, and special requests. Pushes to your POS.' },
        { icon: 'MessageSquare', title: 'SMS Reminders', desc: 'Reduces no-shows by 70% with automatic text reminders before appointments.' },
        { icon: 'PhoneForwarded', title: 'Call Transfer', desc: 'Escalates to a real person when the caller asks for a manager or has a complex request.' },
      ],
    },
    // Pricing
    pricing: {
      title: 'Simple, Transparent Pricing',
      subtitle: '14-Day Free Trial. No credit card required. Cancel anytime.',
      plans: [
        {
          name: 'Starter',
          price: '$49',
          period: '/mo',
          desc: 'For solo salons',
          features: ['24/7 EN/VI answering', 'Appointment booking', 'SMS reminders', '1 booking integration', 'FAQ answering', 'Monthly report'],
          cta: 'Start Free Trial',
          popular: false,
        },
        {
          name: 'Professional',
          price: '$99',
          period: '/mo',
          desc: 'For busy salons',
          features: ['Everything in Starter', 'Unlimited integrations', 'Upsell engine', 'Call recording', 'Deposits and payment links', 'Waitlist automation', 'Vietnamese dashboard'],
          cta: 'Start Free Trial',
          popular: true,
        },
        {
          name: 'Business',
          price: '$199',
          period: '/mo',
          desc: 'For multi-location',
          features: ['Everything in Professional', 'Restaurant phone ordering', 'POS integration', 'Multi-location support', 'Catering and events', 'Priority support'],
          cta: 'Start Free Trial',
          popular: false,
        },
      ],
    },
    // Testimonials
    testimonials: {
      title: 'Trusted by Vietnamese Salon and Restaurant Owners',
      items: [
        { name: 'Linda Nguyen', business: 'Linda Nails, Falls Church VA', quote: 'We used to miss so many calls during busy hours. Since switching, the AI picks up every single one. Saturday bookings went up 40% in the first month.', rating: 5 },
        { name: 'Kevin Tran', business: 'Pho 79, Reston VA', quote: 'The AI takes orders in Vietnamese and English. Our customers love it. No more missed orders during the lunch rush.', rating: 5 },
        { name: 'Mai Le', business: 'Mai Beauty Spa, Houston TX', quote: 'I cannot afford a full-time receptionist. This costs less than one day of pay and works 24/7. Best investment for my salon.', rating: 5 },
      ],
    },
    // FAQ
    faq: {
      title: 'Frequently Asked Questions',
      items: [
        { question: 'Does it really speak Vietnamese?', answer: 'Yes, fluently. It auto-detects whether the caller is speaking English or Vietnamese and responds in the same language. If the caller switches mid-call, the AI switches with them.' },
        { question: 'Do I need to change my phone number?', answer: 'No. You forward your existing number to the AI, or set it as the backup when you are busy. Your customers keep calling the same number.' },
        { question: 'How long does setup take?', answer: 'About 5-7 minutes. You fill out a form with your business info, services, and hours. The AI is ready to answer calls immediately after setup.' },
        { question: 'Will it work with my booking system?', answer: 'It works with Vagaro, Fresha, Booksy, Square, and more. If your system has an API, we can connect directly. Otherwise, you get booking details by SMS and email.' },
        { question: 'What if the AI cannot answer a question?', answer: 'It takes a message and sends you an SMS instantly. It never makes up answers. You stay in control of edge cases.' },
        { question: 'Can I cancel anytime?', answer: 'Yes. No contracts, no cancellation fees. Month-to-month. Cancel from your dashboard at any time.' },
      ],
    },
    // Final CTA
    finalCta: {
      title: 'Ready to Never Miss Another Call?',
      subtitle: 'Start your 14-day free trial today. No credit card required.',
      button: 'Get Started Free',
    },
    // Footer
    footer: {
      tagline: 'Bilingual AI voice receptionist for Vietnamese nail salons and restaurants.',
      features: 'Features',
      pricing: 'Pricing',
      faq: 'FAQ',
      signUp: 'Sign Up',
      login: 'Login',
      copyright: '© 2026 Voice Receptionist AI. All rights reserved.',
    },
    // Sample call modal
    sampleCall: {
      title: 'Hear a Sample Call',
      description: 'Listen to how Linh answers a call in both English and Vietnamese.',
      close: 'Close',
    },
  },
  vi: {
    nav: {
      features: 'Tính Năng',
      pricing: 'Bảng Giá',
      howItWorks: 'Cách Hoạt Động',
      faq: 'Câu Hỏi',
      startTrial: 'Dùng Thử Miễn Phí',
      login: 'Đăng Nhập',
      languageToggle: 'EN',
    },
    hero: {
      title: 'Không Bỏ Lỡ Cuộc Gọi. Không Mất Khách Hàng.',
      subtitle:
        'Lễ tân AI nói được tiếng Anh và tiếng Việt — trả lời mọi cuộc gọi 24/7, đặt lịch hẹn, nhận đơn hàng. Xây dựng cho tiệm nail và nhà hàng Việt Nam.',
      ctaPrimary: 'Dùng Thử 14 Ngày Miễn Phí',
      ctaSecondary: 'Nghe Cuộc Gọi Mẫu',
      badge1: 'Không Cần Thẻ Tín Dụng',
      badge2: 'Cài Đặt Trong 5 Phút',
      badge3: 'Hủy Bất Cứ Lúc Nào',
    },
    problem: {
      title: 'Vấn Đề',
      items: [
        { title: '40% cuộc gọi bị bỏ lỡ', desc: 'Khi bạn đang bận phục vụ khách, điện thoại cứ reo. Mỗi cuộc gọi bỏ lỡ là một khách hàng mất.' },
        { title: 'Rào cản ngôn ngữ', desc: 'Khách hàng nói tiếng Việt không thể để lại tin nhắn bằng tiếng mẹ đẻ. Giao tiếp bị gián đoạn.' },
        { title: 'Lễ tân tốn $2,500+/tháng', desc: 'Thuê lễ tân song ngữ rất đắt. Hầu hết tiệm nail và nhà hàng nhỏ không thể chi trả.' },
      ],
    },
    solution: {
      title: 'Giải Pháp',
      items: [
        { title: 'AI trả lời mọi cuộc gọi ngay lập tức', desc: '24/7. Không bao giờ bỏ lỡ cuộc gọi, kể cả ngoài giờ hoặc giờ cao điểm.' },
        { title: 'Nói tiếng Anh và tiếng Việt', desc: 'Tự động nhận diện ngôn ngữ người gọi và phản hồi thành thạo. Không cần đường dây riêng.' },
        { title: 'Bắt đầu từ $49/tháng', desc: 'Không cần trả lương lễ tân. Không phí theo phút. Một mức giá cố định, hủy bất cứ lúc nào.' },
      ],
    },
    howItWorks: {
      title: 'Cách Hoạt Động',
      steps: [
        { title: 'Chuyển Số Của Bạn', desc: 'Giữ nguyên số điện thoại hiện tại. Cài AI làm dự phòng khi bận, hoặc để AI trả lời tất cả cuộc gọi.' },
        { title: 'AI Trả Lời và Đặt Lịch', desc: 'AI chào khách bằng ngôn ngữ của họ, trả lời câu hỏi, đặt lịch hẹn, và nhận đơn hàng.' },
        { title: 'Bạn Nhận Được Lịch Hẹn', desc: 'Nhận SMS ngay lập tức với chi tiết lịch hẹn. Khách nhận tin nhắn xác nhận. Đến và phục vụ khách.' },
      ],
    },
    features: {
      title: 'Tất Cả Những Gì Bạn Cần',
      items: [
        { icon: 'Languages', title: 'Song Ngữ EN/VI', desc: 'Tự động nhận diện người gọi nói tiếng Anh hay tiếng Việt và phản hồi thành thạo bằng ngôn ngữ đó.' },
        { icon: 'Clock', title: 'Trả Lời 24/7', desc: 'Không bao giờ bỏ lỡ cuộc gọi. AI trả lời ngay lập tức, ngày hay đêm, cuối tuần và ngày lễ.' },
        { icon: 'Calendar', title: 'Đặt Lịch Hẹn', desc: 'Ghi nhận tên, dịch vụ, thời gian yêu thích, và thợ nail. Gửi SMS xác nhận cho khách.' },
        { icon: 'UtensilsCrossed', title: 'Nhận Đơn Hàng Điện Thoại', desc: 'Nhận đơn hàng đầy đủ với món, yêu cầu đặc biệt, và đẩy vào hệ thống POS của bạn.' },
        { icon: 'MessageSquare', title: 'Nhắc Nhở SMS', desc: 'Giảm tỷ lệ không đến 70% với tin nhắn nhắc lịch tự động trước cuộc hẹn.' },
        { icon: 'PhoneForwarded', title: 'Chuyển Cuộc Gọi', desc: 'Chuyển cho người thật khi khách yêu cầu quản lý hoặc có yêu cầu phức tạp.' },
      ],
    },
    pricing: {
      title: 'Giá Đơn Giản, Rõ Ràng',
      subtitle: 'Dùng Thử 14 Ngày Miễn Phí. Không cần thẻ tín dụng. Hủy bất cứ lúc nào.',
      plans: [
        {
          name: 'Khởi Đầu',
          price: '$49',
          period: '/tháng',
          desc: 'Cho tiệm nhỏ',
          features: ['Trả lời EN/VI 24/7', 'Đặt lịch hẹn', 'Nhắc nhở SMS', '1 kết nối đặt lịch', 'Trả lời FAQ', 'Báo cáo hàng tháng'],
          cta: 'Dùng Thử Miễn Phí',
          popular: false,
        },
        {
          name: 'Chuyên Nghiệp',
          price: '$99',
          period: '/tháng',
          desc: 'Cho tiệm bận rộn',
          features: ['Tất cả gói Khởi Đầu', 'Kết nối không giới hạn', 'Gợi ý bán thêm', 'Ghi âm cuộc gọi', 'Tiền cọc và thanh toán', 'Tự động danh sách chờ', 'Bảng điều khiển tiếng Việt'],
          cta: 'Dùng Thử Miễn Phí',
          popular: true,
        },
        {
          name: 'Doanh Nghiệp',
          price: '$199',
          period: '/tháng',
          desc: 'Cho nhiều chi nhánh',
          features: ['Tất cả gói Chuyên Nghiệp', 'Nhận đơn hàng nhà hàng', 'Kết nối POS', 'Hỗ trợ nhiều chi nhánh', 'Tiệc và sự kiện', 'Hỗ trợ ưu tiên'],
          cta: 'Dùng Thử Miễn Phí',
          popular: false,
        },
      ],
    },
    testimonials: {
      title: 'Được Tin Tưởng Bởi Chủ Tiệm Nail và Nhà Hàng Việt Nam',
      items: [
        { name: 'Linda Nguyen', business: 'Linda Nails, Falls Church VA', quote: 'Trước đây chúng tôi bỏ lỡ rất nhiều cuộc gọi lúc bận. Từ khi dùng AI, cuộc gọi nào cũng được trả lời. Lịch hẹn thứ Bảy tăng 40% trong tháng đầu.', rating: 5 },
        { name: 'Kevin Tran', business: 'Pho 79, Reston VA', quote: 'AI nhận đơn bằng tiếng Việt và tiếng Anh. Khách hàng rất thích. Không còn bỏ lỡ đơn hàng trong giờ cao điểm trưa.', rating: 5 },
        { name: 'Mai Le', business: 'Mai Beauty Spa, Houston TX', quote: 'Tôi không thể thuê lễ tân toàn thời gian. Cái này rẻ hơn một ngày lương và hoạt động 24/7. Đầu tư tốt nhất cho tiệm của tôi.', rating: 5 },
      ],
    },
    faq: {
      title: 'Câu Hỏi Thường Gặp',
      items: [
        { question: 'AI có thực sự nói được tiếng Việt không?', answer: 'Có, rất thành thạo. AI tự động nhận diện người gọi nói tiếng Anh hay tiếng Việt và phản hồi bằng ngôn ngữ đó. Nếu người gọi đổi ngôn ngữ giữa cuộc gọi, AI cũng đổi theo.' },
        { question: 'Tôi có cần đổi số điện thoại không?', answer: 'Không. Bạn chuyển tiếp số hiện tại sang AI, hoặc cài làm dự phòng khi bận. Khách hàng vẫn gọi cùng một số.' },
        { question: 'Cài đặt mất bao lâu?', answer: 'Khoảng 5-7 phút. Bạn điền form với thông tin tiệm, dịch vụ, và giờ hoạt động. AI sẵn sàng trả lời cuộc gọi ngay sau khi cài đặt.' },
        { question: 'Có hoạt động với hệ thống đặt lịch của tôi không?', answer: 'Hoạt động với Vagaro, Fresha, Booksy, Square, và nhiều hơn nữa. Nếu hệ thống có API, chúng tôi kết nối trực tiếp. Nếu không, bạn nhận chi tiết lịch hẹn qua SMS và email.' },
        { question: 'Nếu AI không trả lời được câu hỏi thì sao?', answer: 'AI ghi lại tin nhắn và gửi SMS cho bạn ngay lập tức. AI không bao giờ bịa câu trả lời. Bạn luôn kiểm soát các trường hợp đặc biệt.' },
        { question: 'Tôi có thể hủy bất cứ lúc nào không?', answer: 'Có. Không hợp đồng, không phí hủy. Trả theo tháng. Hủy từ bảng điều khiển bất cứ lúc nào.' },
      ],
    },
    finalCta: {
      title: 'Sẵn Sàng Không Bỏ Lỡ Cuộc Gọi Nào Nữa?',
      subtitle: 'Bắt đầu dùng thử 14 ngày miễn phí hôm nay. Không cần thẻ tín dụng.',
      button: 'Bắt Đầu Miễn Phí',
    },
    footer: {
      tagline: 'Lễ tân AI song ngữ cho tiệm nail và nhà hàng Việt Nam.',
      features: 'Tính Năng',
      pricing: 'Bảng Giá',
      faq: 'Câu Hỏi',
      signUp: 'Đăng Ký',
      login: 'Đăng Nhập',
      copyright: '© 2026 Voice Receptionist AI. Mọi quyền được bảo lưu.',
    },
    sampleCall: {
      title: 'Nghe Cuộc Gọi Mẫu',
      description: 'Lắng nghe cách Linh trả lời cuộc gọi bằng cả tiếng Anh và tiếng Việt.',
      close: 'Đóng',
    },
  },
} as const;

export type TranslationKeys = typeof translations.en;
