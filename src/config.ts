/**
 * ====== غيّر الاسم من هنا فقط ======
 */
export const BRAND = 'STREET'

/**
 * ====== الصور والملفات (كلها اختيارية) ======
 * سيب أي قيمة فاضية '' وهتظهر خانة رمادية فاضية مكانها.
 * حط الملفات في public/assets/ وكتب مسارها هنا، مثال: '/assets/logo.png'
 */
export const ASSETS = {
  /** لوجو أسود شفاف PNG/SVG يظهر في شاشة البداية ومنيو الموبايل (اختياري، لو فاضي بيظهر الاسم كنص) */
  logo: '',
  /** فيديو خلفية شاشة البداية من public/assets/intro1.mp4 */
  introVideo: '/assets/intro1.mp4',
  /** موديل اللوجو ثلاثي الأبعاد (GLB). لو فاضي بيتعمل اللوجو من حروف الاسم بمعدن كروم */
  logoModel: '',
  /** خلفيات المشاهد الأربعة في الصفحة الأولى (صورة بانوراما أو فيديو). 4 عناصر بالترتيب */
  scenes: ['', '', '', ''] as string[],
  /** صورة (أو فيديو) الهيرو في أول صفحة المتجر */
  storeHero: '/assets/hero1.mp4',
  /** صورة صفحة About Us */
  about: '',
}


export const ANNOUNCEMENTS = [
  'STREET — THE FIRST DROP IS IN PREPARATION',
  'PRODUCT DETAILS AND ORDER INFORMATION COMING SOON',
]
