import { useEffect, useMemo, useRef, useState, memo } from "react";
import { Users2, Check, Plus, Minus, Star, ShoppingBag, Sparkles, Heart, MapPin, Phone, Mail, Globe, MessageCircle } from "lucide-react";
import productVideo from "./assets/ME MODA.mp4";
import logoImg from "./assets/Logo.jpg";
import { addOrder } from "./firestoreService";

// Load images dynamically from assets using Vite's glob import
const menImages = import.meta.glob("./assets/men/**/*.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});
const womenImages = import.meta.glob(
  "./assets/women/**/*.{jpg,jpeg,png,webp}",
  { eager: true, query: "?url", import: "default" }
);

// Build product items from imported images
function buildItems(mapObj, category) {
  return Object.entries(mapObj)
    .map(([path, url], idx) => {
      const nameFromFile =
        path
          .split("/")
          .pop()
          ?.replace(/\.[^.]+$/, "") ?? `${category}-${idx + 1}`;
      return {
        id: `${category}-${idx}-${nameFromFile}`,
        name: nameFromFile,
        category,
        image: url,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));
}

// Product Card: serve a low-res image by default and load full-res when selected
const ProductCard = memo(
  ({ item, selected, disabled, onToggle }) => {
    const lowResSrc = `${item.image}?width=120&quality=15`;
    const src = lowResSrc;

    return (
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle(item.id);
          }
        }}
        disabled={disabled}
        className={`relative flex flex-col items-center justify-center rounded-md py-2 px-2 text-xs font-semibold cursor-pointer focus:outline-none transition-none border ${
          selected
            ? "border-[#be9f4e] bg-linear-to-b from-white via-[#fffaf0] to-[#fdfaf4] text-neutral-900 shadow-md"
            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        aria-pressed={selected}
      >
        <div
          className={`w-12 h-12 sm:w-14 md:w-16 rounded-lg overflow-hidden mb-1 flex items-center justify-center bg-gray-100 ${
            selected ? "ring-2 ring-[#be9f4e]" : ""
          }`}
        >
          <img
            src={src}
            alt={item.name}
            role="img"
            className="w-full h-full object-cover pointer-events-none"
            loading="lazy"
            decoding="async"
            // Keep priority normal for previews; do not force high priority
            // when selected to avoid loading the large image on click.
            fetchPriority="auto"
            // Only provide the small preview in srcSet so the browser won't
            // request larger variants when the user selects the card.
            srcSet={`${lowResSrc} 200w`}
            sizes="(max-width: 800px) 100vw, 50vw"
          />
        </div>

        <div className="text-[10px] text-center truncate w-full leading-tight normal-case">
          {item.name}
        </div>

        {selected && (
          <div className="absolute top-1 right-1 bg-[#be9f4e] text-white rounded-full p-0.5">
            <Check className="w-3 h-3" />
          </div>
        )}
      </button>
    );
  },
  (prev, next) =>
    prev.selected === next.selected &&
    prev.disabled === next.disabled &&
    prev.item.id === next.item.id
);

const MEN = "men";
const WOMEN = "women";

export default function ProductPage() {
  // Build product lists once
  const allMen = useMemo(() => buildItems(menImages, MEN), []);
  const allWomen = useMemo(() => buildItems(womenImages, WOMEN), []);

  // State
  const [activeCategory, setActiveCategory] = useState(MEN);
  const [selectedMen, setSelectedMen] = useState(new Set());
  const [selectedWomen, setSelectedWomen] = useState(new Set());
  const [desiredCount, setDesiredCount] = useState(1);
  const [offerSize, setOfferSize] = useState(2);

  // Refs
  const formRef = useRef(null);
  const videoRef = useRef(null);
  const targetCountRef = useRef(0);
  const selectedMenRef = useRef(selectedMen);
  const selectedWomenRef = useRef(selectedWomen);

  // Calculations
  const totalSelected = selectedMen.size + selectedWomen.size;
  const targetCount = offerSize * Number(desiredCount || 0);
  const remaining = Math.max(targetCount - totalSelected, 0);

  const price = useMemo(() => {
    const cnt = Number(desiredCount || 0);
    if (offerSize === 4) return cnt * 800;
    if (offerSize === 2) return cnt * 500;
    return cnt * 250;
  }, [offerSize, desiredCount]);

  const delivery = 40;
  const grandTotal = price + (price > 0 ? delivery : 0);

  // Keep refs in sync
  useEffect(() => {
    targetCountRef.current = targetCount;
    selectedMenRef.current = selectedMen;
    selectedWomenRef.current = selectedWomen;
  }, [targetCount, selectedMen, selectedWomen]);

  // activeCategory ref so toggleItem can stay stable
  const activeCategoryRef = useRef(activeCategory);
  useEffect(() => {
    activeCategoryRef.current = activeCategory;
  }, [activeCategory]);

  // Video loop handler
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onEnd = () => {
      try {
        v.currentTime = 0;
        v.play().catch(() => {});
      } catch (_) {}
    };
    v.addEventListener("ended", onEnd);
    return () => v.removeEventListener("ended", onEnd);
  }, []);

  // Toggle item selection - keep function reference stable using refs
  const toggleItem = (itemId) => {
    const currentCategory = activeCategoryRef.current;
    if (!currentCategory) return;
    const isMen = currentCategory === MEN;

    if (isMen) {
      setSelectedMen((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
          return newSet;
        }
        const currentTotal = prev.size + selectedWomenRef.current.size;
        if (targetCountRef.current && currentTotal >= targetCountRef.current) {
          return prev;
        }
        newSet.add(itemId);
        return newSet;
      });
    } else {
      setSelectedWomen((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
          return newSet;
        }
        const currentTotal = selectedMenRef.current.size + prev.size;
        if (targetCountRef.current && currentTotal >= targetCountRef.current) {
          return prev;
        }
        newSet.add(itemId);
        return newSet;
      });
    }
  };

  const handleOrderNow = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalSelected !== targetCount) {
      alert("رجاءً أكمل اختيار العطور بحسب العرض");
      return;
    }

    const form = e.target;
    const formData = new FormData(form);
    const customerName = (formData.get("customerName") || "").trim();
    const phone = (formData.get("phone") || "").trim();
    const province = (formData.get("province") || "").trim();
    const address = (formData.get("address") || "").trim();
    const notes = (formData.get("notes") || "").trim();

    // Validate customer name
    if (!customerName || customerName.length < 3) {
      alert("رجاءً أدخل اسمك الكامل (3 أحرف على الأقل)");
      return;
    }

    // Validate Egyptian phone number (must start with 01 and be 11 digits)
    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (!phone || !phoneRegex.test(phone)) {
      alert("رجاءً أدخل رقم هاتف مصري صحيح (يبدأ بـ 01 ويتكون من 11 رقم)");
      return;
    }

    // Validate province
    if (!province || province.length < 2) {
      alert("رجاءً أدخل اسم المحافظة");
      return;
    }

    // Validate address
    if (!address || address.length < 10) {
      alert("رجاءً أدخل عنوان تفصيلي (10 أحرف على الأقل)");
      return;
    }

    // Build selected items array with basic metadata
    const selectedIds = [...selectedMen, ...selectedWomen];
    const findItem = (id) =>
      allMen.find((i) => i.id === id) || allWomen.find((i) => i.id === id);
    const items = selectedIds.map((id) => {
      const it = findItem(id);
      return it
        ? { id: it.id, name: it.name, image: it.image, category: it.category }
        : { id };
    });

    const order = {
      customerName,
      phone,
      province,
      address,
      notes,
      items,
      offerSize,
      desiredCount,
      price,
      delivery,
      grandTotal,
    };

    try {
      const id = await addOrder(order);
      alert(`تم إنشاء الطلب بنجاح (رقم: ${id})`);
      // clear selections and form
      setSelectedMen(new Set());
      setSelectedWomen(new Set());
      form.reset();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.");
    }
  };

  return (
    <div dir="rtl" className="min-h-svh bg-linear-to-br from-amber-50 via-white to-orange-50 text-neutral-900">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-amber-200 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo image */}
            <img
              src={logoImg}
              alt="ASIA logo"
              className="w-10 h-10 object-cover rounded-full ring-2 ring-[#be9f4e] ring-offset-2 animate-pulse"
            />
            <div className="leading-tight">
              <div className="font-bold text-lg bg-linear-to-r from-[#be9f4e] to-[#8b7038] bg-clip-text text-transparent">ASIA</div>
              <div className="text-xs text-amber-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                عطور فاخرة
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#be9f4e] animate-bounce" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Media */}
        <section className="space-y-4">
          <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-black">
            <video
              ref={videoRef}
              src={productVideo}
              className="w-full h-auto"
              loop
              muted
              playsInline
              autoPlay
              controls
            />
          </div>
        </section>

        {/* Details + Selector */}
        <section className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold bg-linear-to-r from-[#be9f4e] via-[#d4af37] to-[#be9f4e] bg-clip-text text-transparent animate-pulse">عطور مميزة</h1>
              <Heart className="w-6 h-6 text-red-500 fill-red-500 animate-pulse" />
            </div>
            
            {/* Star Rating */}
            <div className="flex items-center gap-3 bg-linear-to-r from-amber-50 to-orange-50 rounded-lg px-4 py-3 border border-amber-200 shadow-md">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((star) => (
                  <Star key={star} className="w-5 h-5 text-amber-500 fill-amber-500" />
                ))}
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" style={{ clipPath: 'inset(0 80% 0 0)' }} />
                <Star className="w-5 h-5 text-amber-500" style={{ clipPath: 'inset(0 0 0 20%)' }} />
              </div>
              <span className="text-2xl font-bold text-amber-700">4.2</span>
              <span className="text-sm text-amber-600">من 5</span>
              <span className="text-xs text-neutral-500 mr-auto">(٢٤٥+ تقييم)</span>
            </div>
            
            <p className="text-sm text-neutral-600 leading-relaxed">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                استمتع بتجربة عطرية فاخرة
              </span>
              . اختر عطورك المفضلة من تشكيلتنا الرجالية
              والنسائية، مع عروض مميزة لتوفير أكبر.
            </p>
            <div className="text-red-600 text-xs">
              ملاحظة: اختر نوع العرض أولاً ثم حدد عدد هذه العروض باستخدام العداد
              أسفل الصفحة.
            </div>
            <div className="mt-2 w-full flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setOfferSize(2)}
                className={
                  "flex flex-col items-center px-4 py-3 rounded-xl text-sm text-center transition-all duration-300 transform hover:scale-105 " +
                  (offerSize === 2
                    ? "bg-linear-to-br from-[#be9f4e] to-[#8b7038] text-white shadow-lg ring-2 ring-amber-300 ring-offset-2"
                    : "bg-white text-neutral-700 border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50 shadow-md")
                }
                aria-pressed={offerSize === 2}
              >
                <span className="font-bold text-base">🎁 عرض 2</span>
                <span className={"text-xs " + (offerSize === 2 ? "text-amber-100" : "text-neutral-500")}>
                  2 عطور — 500 جنيه
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOfferSize(4)}
                className={
                  "flex flex-col items-center px-4 py-3 rounded-xl text-sm text-center transition-all duration-300 transform hover:scale-105 " +
                  (offerSize === 4
                    ? "bg-linear-to-br from-[#be9f4e] to-[#8b7038] text-white shadow-lg ring-2 ring-amber-300 ring-offset-2"
                    : "bg-white text-neutral-700 border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50 shadow-md")
                }
                aria-pressed={offerSize === 4}
              >
                <span className="font-bold text-base">🎁 عرض 4</span>
                <span className={"text-xs " + (offerSize === 4 ? "text-amber-100" : "text-neutral-500")}>
                  4 عطور — 800 جنيه
                </span>
              </button>
            </div>
          </div>
          <div>
            <button
              onClick={handleOrderNow}
              className="w-full mt-2 px-6 py-3 rounded-xl bg-linear-to-r from-[#be9f4e] via-[#d4af37] to-[#be9f4e] text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 animate-pulse"
            >
              <ShoppingBag className="w-5 h-5" />
              اطلب الآن
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
          {/* counter removed from inline details — moved to sticky bottom bar */}

          <div className="flex items-center gap-3 text-sm">
            <div className="inline-flex rounded-xl border-2 border-amber-200 p-1 bg-linear-to-r from-amber-50 to-orange-50 shadow-md">
              <button
                onClick={() => setActiveCategory(MEN)}
                aria-pressed={activeCategory === MEN}
                className={`px-3 py-1.5 rounded-lg text-sm sm:text-lg transition-all duration-300 flex items-center justify-center gap-2 min-w-18 sm:min-w-24 ${
                  activeCategory === MEN
                    ? "bg-linear-to-br from-[#be9f4e] to-[#8b7038] text-white shadow-lg ring-2 ring-amber-300 transform scale-105 font-semibold"
                    : "text-neutral-700 hover:bg-white hover:shadow-md"
                }`}
              >
                👔 رجالي
              </button>
              <button
                onClick={() => setActiveCategory(WOMEN)}
                aria-pressed={activeCategory === WOMEN}
                className={`px-3 py-1.5 rounded-lg text-sm sm:text-lg transition-all duration-300 flex items-center justify-center gap-2 min-w-18 sm:min-w-24 ${
                  activeCategory === WOMEN
                    ? "bg-linear-to-br from-[#be9f4e] to-[#8b7038] text-white shadow-lg ring-2 ring-amber-300 transform scale-105 font-semibold"
                    : "text-neutral-700 hover:bg-white hover:shadow-md"
                }`}
              >
                👗 نسائي
              </button>
            </div>
            <div className="ms-auto inline-flex items-center gap-2 text-sm bg-white rounded-full px-3 py-1.5 shadow-md border border-amber-200">
              <Users2 className="size-4 text-[#be9f4e] animate-pulse" />
              <span className="font-semibold">
                المختار: {totalSelected}
                {targetCount ? ` / ${targetCount}` : ""}
              </span>
              {targetCount ? (
                <span className="text-white bg-linear-to-r from-orange-500 to-red-500 px-3 py-1 rounded-full font-bold animate-bounce shadow-md">
                  متبقي: {remaining}
                </span>
              ) : null}
            </div>
          </div>

          {/* Grid - render both categories, show/hide with CSS for instant switching */}
          {!activeCategory ? (
            <div className="py-8 text-center text-neutral-500">
              اختر فئة "رجالي" أو "نسائي" لعرض العطور
            </div>
          ) : null}

          <div
            className={`grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 ${
              activeCategory === MEN ? "" : "hidden"
            }`}
          >
            {allMen.map((item) => {
              const selected = selectedMen.has(item.id);
              const disabled =
                !selected && targetCount && totalSelected >= targetCount;
              return (
                <ProductCard
                  key={item.id}
                  item={item}
                  selected={selected}
                  disabled={disabled}
                  onToggle={toggleItem}
                />
              );
            })}
          </div>

          <div
            className={`grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 ${
              activeCategory === WOMEN ? "" : "hidden"
            }`}
          >
            {allWomen.map((item) => {
              const selected = selectedWomen.has(item.id);
              const disabled =
                !selected && targetCount && totalSelected >= targetCount;
              return (
                <ProductCard
                  key={item.id}
                  item={item}
                  selected={selected}
                  disabled={disabled}
                  onToggle={toggleItem}
                />
              );
            })}
          </div>

          {/* Order form */}
          <form
            ref={formRef}
            className="rounded-2xl border-2 border-amber-300 bg-linear-to-br from-white to-amber-50 p-6 space-y-4 shadow-xl"
            onSubmit={handleSubmit}
          >
            <h2 className="text-2xl font-bold bg-linear-to-r from-[#be9f4e] to-[#8b7038] bg-clip-text text-transparent flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-[#be9f4e]" />
              تأكيد الطلب
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm text-neutral-700">الاسم</label>
                <input
                  required
                  name="customerName"
                  type="text"
                  minLength={3}
                  maxLength={100}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#be9f4e]"
                  placeholder="اكتب اسمك الكامل"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-neutral-700">رقم الهاتف</label>
                <input
                  required
                  name="phone"
                  type="tel"
                  pattern="01[0125][0-9]{8}"
                  minLength={11}
                  maxLength={11}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#be9f4e]"
                  placeholder="01XXXXXXXXX"
                  title="أدخل رقم هاتف مصري صحيح (يبدأ بـ 01 ويتكون من 11 رقم)"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-sm text-neutral-700">المحافظه</label>
                <input
                  required
                  name="province"
                  type="text"
                  minLength={2}
                  maxLength={50}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#be9f4e]"
                  placeholder="اكتب اسم محافظتك"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-sm text-neutral-700">العنوان</label>
                <input
                  required
                  name="address"
                  type="text"
                  minLength={10}
                  maxLength={300}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#be9f4e]"
                  placeholder="المدينة، الشارع، أقرب علامة مميزة"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-sm text-neutral-700">ملاحظات</label>
                <textarea
                  name="notes"
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#be9f4e]"
                  placeholder="أي تفاصيل إضافية للطلب"
                />
              </div>
            </div>

            <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-sm">
              {/* Offer breakdown removed from UI per request */}
              <div className="flex items-center justify-between">
                <span>سعر العطور</span>
                <span>
                  {price !== undefined && price !== null
                    ? `${price} جنيه`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>سعر التوصيل</span>
                <span>{delivery} جنيه</span>
              </div>
              <div className="flex items-center justify-between font-bold border-t mt-2 pt-2">
                <span>الإجمالي</span>
                <span>
                  {grandTotal !== undefined && grandTotal !== null
                    ? `${grandTotal} جنيه`
                    : "—"}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 rounded-xl bg-linear-to-r from-green-500 to-emerald-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={totalSelected !== targetCount}
              title={totalSelected !== targetCount ? "أكمل اختيار العطور" : ""}
            >
              <Check className="w-5 h-5" />
              تأكيد الطلب
              <Sparkles className="w-5 h-5" />
            </button>
            {/* no offer requirement; user selects desired count using the counter above */}
          </form>
        </section>
      </main>

      {/* Sticky bottom bar with counter and order button (full width) */}
      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="w-full bg-linear-to-r from-amber-50 via-white to-orange-50 border-t-2 border-amber-300 shadow-2xl backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-center gap-4">
            <div className="inline-flex items-center gap-2 px-1 bg-white rounded-full shadow-lg border-2 border-amber-200">
              <button
                type="button"
                onClick={() => setDesiredCount((c) => Math.max(1, c - 1))}
                className="p-2 rounded-full bg-linear-to-br from-red-500 to-pink-500 border-2 border-red-300 text-white hover:scale-110 transition-all duration-200 flex items-center justify-center focus:outline-none shadow-md"
                aria-label="نقص"
                title="نقص"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div
                className="px-5 py-2 text-center w-14 text-lg font-bold bg-linear-to-br from-[#be9f4e] to-[#8b7038] text-white rounded-full shadow-lg flex items-center justify-center"
                aria-live="polite"
                aria-atomic="true"
                title={`عدد العروض: ${desiredCount}`}
              >
                {desiredCount}
              </div>
              <button
                type="button"
                onClick={() => setDesiredCount((c) => Math.min(20, c + 1))}
                className="p-2 rounded-full bg-linear-to-br from-green-500 to-emerald-500 border-2 border-green-300 text-white hover:scale-110 transition-all duration-200 flex items-center justify-center focus:outline-none shadow-md"
                aria-label="زيادة"
                title="زيادة"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleOrderNow}
              className="px-8 py-3 rounded-full bg-linear-to-r from-[#be9f4e] via-[#d4af37] to-[#be9f4e] text-white font-bold text-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2 border-2 border-amber-300"
            >
              <ShoppingBag className="w-5 h-5 animate-bounce" />
              اطلب الآن
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <footer className="w-full bg-linear-to-br from-amber-900 via-neutral-900 to-neutral-800 mt-20 text-white">
        {/* Main Footer Content */}
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={logoImg}
                  alt="ASIA logo"
                  className="w-12 h-12 object-cover rounded-full ring-2 ring-amber-400 ring-offset-2 ring-offset-neutral-900"
                />
                <div>
                  <h3 className="text-2xl font-bold bg-linear-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">ASIA</h3>
                  <p className="text-xs text-amber-300">عطور فاخرة منذ سنوات</p>
                </div>
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed">
                نقدم لك أرقى العطور الرجالية والنسائية بأفضل الأسعار. جودة عالية وخدمة متميزة.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" style={{ clipPath: 'inset(0 80% 0 0)' }} />
                <span className="text-xs text-amber-300 mr-2">4.2 من 5</span>
              </div>
            </div>

            {/* Locations Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-amber-300">
                <MapPin className="w-5 h-5" />
                فروعنا
              </h3>
              <div className="space-y-3 text-sm">
                <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors border border-white/10">
                  <div className="font-semibold text-amber-200 mb-1">مدينة طنطا</div>
                  <ul className="space-y-1 text-neutral-300 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>شارع نادي المعلمين بجانب بوابة نادي طنطا</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>شارع سعيد تقاطع شارع محب</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>شارع الأشرف مول أوت ليت</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors border border-white/10">
                  <div className="font-semibold text-amber-200 mb-1">فروع أخرى</div>
                  <ul className="space-y-1 text-neutral-300 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>السادات — مول سيڤن ستارز</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>الإسكندرية — سموحة</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>السويس — الملاحة</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-amber-300">
                <MessageCircle className="w-5 h-5" />
                تواصل معنا
              </h3>
              <div className="space-y-3">
                <a 
                  href="tel:+201099949245"
                  className="flex items-center gap-3 text-sm bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all hover:scale-105 border border-white/10 group"
                >
                  <div className="bg-amber-500 p-2 rounded-full group-hover:bg-amber-400 transition-colors">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <div dir="ltr" className="text-left">
                    <div className="text-xs text-neutral-400">Phone</div>
                    <div className="text-amber-200 font-medium">+20 10 99949245</div>
                  </div>
                </a>

                <a 
                  href="https://wa.me/201090988215"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-sm bg-green-500/10 rounded-lg p-3 hover:bg-green-500/20 transition-all hover:scale-105 border border-green-500/30 group"
                >
                  <div className="bg-green-500 p-2 rounded-full group-hover:bg-green-400 transition-colors">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div dir="ltr" className="text-left">
                    <div className="text-xs text-neutral-400">WhatsApp</div>
                    <div className="text-green-300 font-medium">+20 10 90988215</div>
                  </div>
                </a>

                <a 
                  href="mailto:asiaaegy@gmail.com"
                  className="flex items-center gap-3 text-sm bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all hover:scale-105 border border-white/10 group"
                >
                  <div className="bg-blue-500 p-2 rounded-full group-hover:bg-blue-400 transition-colors">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <div dir="ltr" className="text-left">
                    <div className="text-xs text-neutral-400">Email</div>
                    <div className="text-blue-300 font-medium text-xs">asiaaegy@gmail.com</div>
                  </div>
                </a>

                <a 
                  href="https://asiaegy.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-sm bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all hover:scale-105 border border-white/10 group"
                >
                  <div className="bg-purple-500 p-2 rounded-full group-hover:bg-purple-400 transition-colors">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <div dir="ltr" className="text-left">
                    <div className="text-xs text-neutral-400">Website</div>
                    <div className="text-purple-300 font-medium">asiaegy.com</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 bg-black/30">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 text-neutral-400">
                <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                <span>جميع الحقوق محفوظة © {new Date().getFullYear()} ASIA</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-400">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span className="text-xs">21 شارع نادي المعلمين، طنطا، مصر</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
