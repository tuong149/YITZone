/**
 * @typedef {Object} StoreProductDetail
 * @property {string} shortSummary
 * @property {string} description
 * @property {string[]} highlights
 * @property {string} materialOrIngredients
 * @property {string} pickupNote
 * @property {string} exchangePolicy
 * @property {any} [sizeGuide]
 */

export const FACULTY_MERCH_PRODUCTS = [
  {
    id: "prd-hoodie",
    name: "Áo khoác Hoodie FIT HCM-UTE 2026",
    productType: "FACULTY_MERCH",
    campaignId: null,
    campaignLabel: "Vật phẩm Khoa (Thường trực)",
    categoryCode: "UNIFORM_APPAREL",
    categoryLabel: "Đồng phục & Áo Khoa",
    image: "/images/card-hoodie.jpg",
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    colors: ["Xanh Navy FIT", "Đen Obsidian"],
    listPrice: 360_000,
    promoPrice: 320_000,
    promotionalBadge: "Pre-order Đợt 2",
    weightKg: 0.75,
    stock: 42,
    isPreorder: true,
    codAllowed: true,
    shortSummary: "Form unisex rộng rãi, nỉ chân cua 360gsm dày dặn, thêu nổi biểu trưng Khoa CNTT HCM-UTE.",
    description:
      "Phiên bản Hoodie chính thức năm học 2026–2027 do Đoàn – Hội Khoa CNTT thiết kế độc quyền. Chất vải nỉ chân cua cotton pha thoáng khí, giữ form tốt khi ngồi phòng máy lạnh và đi học sớm. Logo FIT thêu vi tính sắc nét ở ngực trái, phối họa tiết Node-Grid phía sau lưng.",
    highlights: [
      "Chất liệu nỉ chân cua 360gsm mềm mịn, không xù lông sau nhiều lần giặt",
      "Thêu vi tính mật độ cao ở ngực trái, bo tay & bo gấu co giãn chắc chắn",
      "Túi kangaroo sâu kèm túi phụ nhỏ bên trong đựng thẻ sinh viên",
      "Hỗ trợ đổi size miễn phí tại Văn phòng Đoàn – Hội trong vòng 7 ngày"
    ],
    materialOrIngredients: "80% Cotton, 20% Polyester · Định lượng 360gsm",
    pickupNote: "Nhận trực tiếp tại Văn phòng Đoàn – Hội (A1-204 CS1) hoặc giao phòng học cùng cơ sở.",
    exchangePolicy: "Đổi size miễn phí trong 07 ngày nếu sản phẩm còn nguyên tem nhãn và chưa qua giặt ủi.",
    sizeGuide: [
      { size: "S", height: "1m50 – 1m60", weight: "43 – 52 kg" },
      { size: "M", height: "1m60 – 1m68", weight: "52 – 62 kg" },
      { size: "L", height: "1m68 – 1m75", weight: "62 – 72 kg" },
      { size: "XL", height: "1m75 – 1m80", weight: "72 – 82 kg" },
      { size: "2XL", height: "1m78 – 1m85", weight: "82 – 92 kg" },
      { size: "3XL", height: "Trên 1m82", weight: "Trên 92 kg" }
    ]
  },
  {
    id: "prd-polo",
    name: "Áo Polo Khoa CNTT (Tech Knit)",
    productType: "FACULTY_MERCH",
    campaignId: null,
    campaignLabel: "Vật phẩm Khoa (Thường trực)",
    categoryCode: "UNIFORM_APPAREL",
    categoryLabel: "Đồng phục & Áo Khoa",
    sizes: ["S", "M", "L", "XL", "2XL"],
    colors: ["Trắng Phối Cobalt", "Xanh Navy"],
    listPrice: 210_000,
    promoPrice: 185_000,
    promotionalBadge: "Ưu đãi Tân SV",
    weightKg: 0.35,
    stock: 68,
    codAllowed: true,
    shortSummary: "Vải cá sấu mắt chim thấm hút nhanh, cổ dệt bo sọc Cobalt lịch sự cho ngày thuyết trình & sự kiện.",
    description:
      "Áo Polo đồng phục Khoa CNTT dòng Tech Knit nhẹ, thoáng mát, phù hợp mặc đi học hàng ngày, tham gia hội thảo doanh nghiệp hoặc bảo vệ đồ án. Cổ áo dệt đứng form, không bai nhão.",
    highlights: [
      "Vải cá sấu mắt chim co giãn 4 chiều, khô nhanh trong thời tiết TP.HCM",
      "Bo cổ và bo tay phối viền Cobalt đặc trưng nhận diện Khoa CNTT",
      "Đường may vai đôi chắc chắn, ít nhăn khi gấp trong balo"
    ],
    materialOrIngredients: "65% Cotton, 35% Coolmax Poly · Co giãn 4 chiều",
    pickupNote: "Có sẵn tại Văn phòng CS1 (A1-204), nhận ngay trong giờ trực OFIT.",
    exchangePolicy: "Hỗ trợ đổi size trong 07 ngày tại Văn phòng Đoàn – Hội Khoa.",
    sizeGuide: [
      { size: "S", height: "1m52 – 1m62", weight: "44 – 53 kg" },
      { size: "M", height: "1m62 – 1m70", weight: "53 – 63 kg" },
      { size: "L", height: "1m70 – 1m76", weight: "63 – 73 kg" },
      { size: "XL", height: "1m76 – 1m82", weight: "73 – 83 kg" },
      { size: "2XL", height: "Trên 1m80", weight: "83 – 95 kg" }
    ]
  },
  {
    id: "prd-lanyard",
    name: "Dây đeo thẻ Sinh viên FIT + Bao thẻ",
    productType: "FACULTY_MERCH",
    campaignId: null,
    campaignLabel: "Vật phẩm Khoa (Thường trực)",
    categoryCode: "ACCESSORY",
    categoryLabel: "Phụ kiện Khoa",
    sizes: ["Free Size"],
    colors: ["YIT Cobalt"],
    listPrice: 45_000,
    weightKg: 0.08,
    stock: 150,
    codAllowed: true,
    shortSummary: "Dây satin in chuyển nhiệt 2 mặt kèm khóa tháo nhanh an toàn và bao thẻ mica cứng.",
    description:
      "Bộ dây đeo thẻ sinh viên chính thức của Khoa CNTT giúp quét mã vạch thẻ SV nhanh tại các bàn soát vé sự kiện và thư viện. Đi kèm bao thẻ cứng trong suốt chống cong gãy.",
    highlights: [
      "Bản dây rộng 2cm chất liệu lụa satin mịn, không cọ rát cổ",
      "Khóa kẹp kim loại xoay 360° kèm khớp tháo rời nhanh tiện quẹt thẻ",
      "Bao thẻ nhựa cứng trong suốt đọc mã vạch rõ không cần tháo thẻ"
    ],
    materialOrIngredients: "Dây lụa Satin + Khóa hợp kim + Bao thẻ ABS trong suốt",
    pickupNote: "Nhận ngay tại bàn trực Văn phòng Đoàn – Hội hoặc giao phòng học.",
    exchangePolicy: "Đổi mới 1-1 trong 07 ngày nếu lỗi khóa kẹp hoặc nứt bao thẻ."
  },
  {
    id: "prd-keychain",
    name: "Móc khóa Acrylic YITZone Node-Grid",
    productType: "FACULTY_MERCH",
    campaignId: null,
    campaignLabel: "Vật phẩm Khoa (Thường trực)",
    categoryCode: "ACCESSORY",
    categoryLabel: "Phụ kiện Khoa",
    sizes: ["Free Size"],
    colors: ["Cobalt Trong suốt"],
    listPrice: 35_000,
    weightKg: 0.05,
    stock: 95,
    codAllowed: true,
    shortSummary: "Móc khóa mica cắt laser 2 lớp dày 4mm in UV sắc nét, chống trầy xước.",
    description:
      "Phụ kiện trang trí balo, chìa khóa phòng trọ hoặc túi đựng laptop mang biểu trưng YITZone Node-Grid. Công nghệ in kẹp giữa 2 lớp acrylic giúp hình ảnh bền màu theo thời gian.",
    highlights: [
      "Acrylic trong suốt dày 4mm, cắt laser bo góc mịn tay",
      "In UV 2 mặt kẹp giữa chống bong tróc khi va chạm",
      "Khoen móc thép không gỉ chắc chắn"
    ],
    materialOrIngredients: "Acrylic nguyên sinh 4mm + Khoen thép không gỉ",
    pickupNote: "Có sẵn tại Văn phòng CS1 (A1-204).",
    exchangePolicy: "Đổi mới nếu có vết xước sâu hoặc lỗi in khi kiểm tra nhận hàng."
  }
];

export const FUNDRAISING_XTN_PRODUCTS = [
  {
    id: "prd-banhtrang",
    name: "Bánh tráng trộn bơ tỏi hành phi (Hũ 250g)",
    productType: "FUNDRAISING_ITEM",
    campaignId: "XTN-2027",
    campaignLabel: "Gây quỹ Xuân Tình Nguyện 2027",
    categoryCode: "FUNDRAISING_FOOD_DRINK",
    categoryLabel: "Đồ ăn vặt gây quỹ",
    sizes: ["Cay vừa", "Ít cay"],
    colors: ["Đóng hũ niêm phong"],
    listPrice: 35_000,
    weightKg: 0.28,
    stock: 80,
    codAllowed: true,
    shortSummary: "Đóng hũ PET nắp nhôm niêm phong sạch sẽ, hành phi giòn thơm. 100% lợi nhuận ủng hộ Xuân Tình Nguyện 2027.",
    description:
      "Món ăn vặt gây quỹ được đội hình Xuân Tình Nguyện Khoa CNTT đóng gói mới mỗi ngày, đảm bảo vệ sinh an toàn thực phẩm. Toàn bộ lợi nhuận sau trừ giá vốn được công khai minh bạch và đóng góp vào quỹ quà Tết cho trẻ em vùng xa.",
    highlights: [
      "Hũ PET 250g có màng seal nhôm giữ bánh tráng giòn lâu",
      "Kèm gói bơ béo, hành phi giòn và muối tôm Tây Ninh vừa vị",
      "100% lợi nhuận góp quỹ Chiến dịch Xuân Tình Nguyện 2027"
    ],
    materialOrIngredients: "Bánh tráng phơi sương, hành phi, bơ trứng, muối tôm, tỏi phi",
    pickupNote: "Giao tận phòng học vào giờ giải lao các ca học hoặc nhận tại sảnh Khu A.",
    exchangePolicy: "Đổi hũ mới ngay nếu bung seal hoặc có vấn đề về chất lượng khi nhận."
  },
  {
    id: "prd-tratac",
    name: "Trà tắc mật ong xí muội (Chai 500ml)",
    productType: "FUNDRAISING_ITEM",
    campaignId: "XTN-2027",
    campaignLabel: "Gây quỹ Xuân Tình Nguyện 2027",
    categoryCode: "FUNDRAISING_FOOD_DRINK",
    categoryLabel: "Thức uống gây quỹ",
    sizes: ["500ml", "Combo 2 chai"],
    colors: ["Chai PET ướp lạnh"],
    listPrice: 25_000,
    promoPrice: 20_000,
    promotionalBadge: "Bán chạy",
    weightKg: 0.55,
    stock: 120,
    codAllowed: true,
    shortSummary: "Pha mới trong ngày bằng trà lài, tắc tươi và mật ong thanh mát, giao ướp lạnh tận phòng học.",
    description:
      "Thức uống giải nhiệt bán chạy nhất mùa ôn thi của chiến dịch Xuân Tình Nguyện 2027. Vị chua ngọt dịu nhẹ từ tắc tươi, mật ong nguyên chất và xí muội, phù hợp nạp năng lượng giữa các ca học.",
    highlights: [
      "Pha chế trong ngày, không dùng phẩm màu hay chất bảo quản",
      "Ướp lạnh sẵn trong thùng giữ nhiệt trước khi giao ca học",
      "Mỗi chai đóng góp trực tiếp vào quỹ học bổng Xuân Tình Nguyện"
    ],
    materialOrIngredients: "Trà xanh hương lài, tắc tươi, mật ong, xí muội, đường phèn",
    pickupNote: "Nên dùng trong ngày. Giao lạnh tại phòng học hoặc quầy XTN Khu A.",
    exchangePolicy: "Đổi chai mới ngay tại chỗ nếu nắp chai không còn nguyên vẹn."
  },
  {
    id: "prd-khoga",
    name: "Khô gà lá chanh đặc biệt (Túi Zip 200g)",
    productType: "FUNDRAISING_ITEM",
    campaignId: "XTN-2027",
    campaignLabel: "Gây quỹ Xuân Tình Nguyện 2027",
    categoryCode: "FUNDRAISING_FOOD_DRINK",
    categoryLabel: "Đồ ăn vặt gây quỹ",
    sizes: ["200g", "500g"],
    colors: ["Túi Zip"],
    listPrice: 65_000,
    weightKg: 0.25,
    stock: 54,
    codAllowed: true,
    shortSummary: "Ức gà xé sợi sấy giòn thơm mùi lá chanh, đóng túi zip bạc tiện bảo quản khi học nhóm.",
    description:
      "Khô gà lá chanh chọn lọc từ nguồn cung đạt chuẩn VSATTP, sợi gà mềm dai vừa ăn, không quá khô, hương thơm tự nhiên từ lá chanh và ớt sấy.",
    highlights: [
      "Túi zip bạc 2 lớp kín khí, dễ bảo quản nhiều ngày",
      "Sợi gà ức nạc tẩm ướp đậm đà, thơm mùi lá chanh tươi",
      "Góp phần thực hiện công trình thanh niên Xuân Tình Nguyện 2027"
    ],
    materialOrIngredients: "Thịt ức gà, lá chanh, tỏi, ớt, gia vị tự nhiên",
    pickupNote: "Nhận tại quầy gây quỹ XTN hoặc giao tận phòng học trong ngày.",
    exchangePolicy: "Đổi mới nếu túi zip bị hở hoặc sản phẩm không đạt độ giòn."
  },
  {
    id: "prd-combo-xtn",
    name: "Combo Tiếp sức Ôn thi (Bánh tráng + Trà tắc + Khô gà)",
    productType: "FUNDRAISING_ITEM",
    campaignId: "XTN-2027",
    campaignLabel: "Gây quỹ Xuân Tình Nguyện 2027",
    categoryCode: "FUNDRAISING_FOOD_DRINK",
    categoryLabel: "Combo gây quỹ",
    sizes: ["Tiêu chuẩn"],
    colors: ["Túi giấy XTN"],
    listPrice: 125_000,
    promoPrice: 109_000,
    promotionalBadge: "Tiết kiệm 16k",
    weightKg: 1.05,
    stock: 40,
    codAllowed: true,
    shortSummary: "Trọn bộ 3 món ăn vặt gây quỹ bán chạy nhất, đóng gói trong túi giấy Xuân Tình Nguyện kèm thiệp cảm ơn.",
    description:
      "Lựa chọn tiết kiệm nhất cho nhóm học bài hoặc tặng bạn bè mùa thi cuối kỳ. Gồm 1 hũ Bánh tráng trộn 250g, 1 chai Trà tắc mật ong 500ml và 1 túi Khô gà lá chanh 200g.",
    highlights: [
      "Tiết kiệm 16.000đ so với mua lẻ từng món",
      "Đóng gói gọn gàng trong túi giấy thân thiện môi trường kèm thiệp XTN 2027",
      "Tổng khối lượng 1.05kg — đủ điều kiện giao tận phòng học cùng cơ sở"
    ],
    materialOrIngredients: "1× Bánh tráng 250g + 1× Trà tắc 500ml + 1× Khô gà 200g",
    pickupNote: "Giao tận phòng học (CS1/CS2) hoặc nhận tại quầy XTN.",
    exchangePolicy: "Kiểm tra đủ 3 món khi nhận; hỗ trợ đổi ngay nếu thiếu hoặc lỗi đóng gói."
  }
];

export const ALL_STORE_PRODUCTS = [
  ...FACULTY_MERCH_PRODUCTS,
  ...FUNDRAISING_XTN_PRODUCTS
];

export function getStoreProductById(productId) {
  if (!productId) return undefined;
  return ALL_STORE_PRODUCTS.find((p) => p.id === productId);
}

export function getRelatedStoreProducts(product, limit = 3) {
  return ALL_STORE_PRODUCTS.filter(
    (p) => p.id !== product.id && p.productType === product.productType
  ).slice(0, limit);
}
