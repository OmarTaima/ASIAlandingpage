// ============================================================================
// IMPORTS
// ============================================================================

import { useEffect, useMemo, useRef, useState, memo } from "react";
import {
  Users2,
  Check,
  Plus,
  Minus,
  Star,
  ShoppingBag,
  Sparkles,
  Heart,
  MapPin,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  Volume,
  VolumeX,
} from "lucide-react";
import productVideo from "./assets/ME MODA.mp4";
import logoImg from "./assets/Logo.jpg";
import { addOrder, fetchCountries, fetchCities, fetchGovernorates } from "./api";
import Swal from "sweetalert2";
import productsData from "./products.json";
import branchesData from "./branches.json";

// ============================================================================
// IMAGE IMPORTS (DYNAMIC GLOB IMPORTS)
// ============================================================================

// Import all men's product images from assets/men folder
const menImages = import.meta.glob("./assets/men/**/*.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});

// Import all women's product images from assets/women folder
const womenImages = import.meta.glob(
  "./assets/women/**/*.{jpg,jpeg,png,webp}",
  { eager: true, query: "?url", import: "default" }
);

// Helper to produce low-resolution image URLs by appending query params
function getLowResUrl(url, width = 120, quality = 10) {
  if (!url) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}width=${width}&quality=${quality}`;
}

/**
 * Build product items from imported image glob
 * Extracts product code from filename and derives brand information
 * @param {Object} mapObj - Glob import object with paths and URLs
 * @param {string} category - Product category ("men" or "women")
 * @returns {Array} Array of product objects with metadata
 */
function buildItems(mapObj, category) {
  return Object.entries(mapObj)
    .map(([path, url], idx) => {
      const nameFromFile =
        path
          .split("/")
          .pop()
          ?.replace(/\.[^.]+$/, "") ?? `${category}-${idx + 1}`;

      // Extract the last 3-digit group from the filename as the product code.
      // This handles filenames like "inspired by Boss 113" (code = 113).
      // If no 3-digit group exists, fall back to the last 3 characters.
      const codeMatch = nameFromFile.match(/(\d{3})(?!.*\d)/);
      const code = codeMatch ? codeMatch[1] : nameFromFile.slice(-3);

      // Derive an "inspired by" brand: remove trailing digits and common separators,
      // then strip the phrase "inspired by" if present. Examples:
      //  - "Boss 113" -> "Boss"
      //  - "inspired by Boss 113" -> "Boss"
      let brand = nameFromFile
        .replace(/\d+$/g, "")
        .replace(/[-_.]/g, " ")
        .trim();
      brand = brand.replace(/\binspired?\s+by\b/i, "").trim();
      if (brand === "") brand = null;

      return {
        id: `${category}-${idx}-${nameFromFile}`,
        // expose both full filename and the 3-digit code
        name: code,
        code,
        inspiredBy: brand,
        originalName: nameFromFile,
        category,
        image: url,
      };
    })
    .sort((a, b) => a.originalName.localeCompare(b.originalName, "ar"));
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * ProductCard Component
 * Displays individual product with image, code, and selection state
 * Optimized with memo to prevent unnecessary re-renders
 */
const ProductCard = ({
  item,
  selected,
  disabled,
  onToggle,
  quantity = 0,
  onInc,
  onDec,
}) => {
  const lowResSrc = getLowResUrl(item.image, 120, 10);
  const src = lowResSrc;
  try {
  } catch (_) {}

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
      className={`relative w-full flex flex-row items-center gap-3 rounded-md py-3 px-3 text-sm font-semibold cursor-pointer focus:outline-none transition-none border ${
        selected
          ? "border-[#be9f4e] bg-linear-to-b from-white via-[#fffaf0] to-[#fdfaf4] text-neutral-900 shadow-md"
          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      aria-pressed={selected}
    >
      <div
        className={`flex-none w-20 h-20 sm:w-24 md:w-28 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100 ${
          selected ? "ring-2 ring-[#be9f4e]" : ""
        }`}
      >
        <img
          src={src}
          alt={item.code || item.originalName}
          role="img"
          className="w-full h-full object-cover pointer-events-none"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          srcSet={`${getLowResUrl(item.image,120,10)} 120w, ${getLowResUrl(item.image,240,15)} 240w`}
          sizes="(max-width: 800px) 100vw, 33vw"
        />
      </div>

      <div className="flex-1 leading-tight normal-case px-1 text-right">
        <div className="font-light text-base sm:text-lg text-neutral-900">
          {item.code || item.name}
        </div>
        {item.inspiredBy ? (
          <div className="text-xs text-neutral-500 mt-1">
            مستوحى من {item.inspiredBy}
          </div>
        ) : null}
      </div>

      {selected && (
        <div className="absolute top-1 right-1 bg-[#be9f4e] text-white rounded-full p-0.5">
          <Check className="w-3 h-3" />
        </div>
      )}

      {selected && (
        <div className="absolute top-1 left-1 z-10 flex items-center gap-2 bg-white/90 rounded-full px-2 py-0.5 border border-neutral-200 text-sm sm:gap-1 sm:px-1 sm:text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDec && onDec();
            }}
            aria-label="نقص"
            className="p-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors sm:p-0.5"
          >
            <Minus className="w-4 h-4 sm:w-3 sm:h-3" />
          </button>
          <div className="px-1 font-semibold text-sm text-neutral-800 sm:text-xs">
            {quantity ?? 0}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInc && onInc();
            }}
            aria-label="زيادة"
            className="p-1 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors sm:p-0.5"
          >
            <Plus className="w-4 h-4 sm:w-3 sm:h-3" />
          </button>
        </div>
      )}
    </button>
  );
};

// ============================================================================
// CONSTANTS
// ============================================================================

const MEN = "men";
const WOMEN = "women";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProductPage() {
  // Default company/subCategories used when creating leads/orders
  const DEFAULT_COMPANY_ID = "692fffb4e037d2784032b18f";
  const DEFAULT_SUBCATS = ["69388f1d6d0b1261bbc370c0"];
  // Location data (fetched from API)
  const [countriesData, setCountriesData] = useState([]);
  const [governmentsData, setGovernmentsData] = useState([]);
  const [citiesData, setCitiesData] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [fixedCountry, setFixedCountry] = useState(null);
  const [selectedGovernment, setSelectedGovernment] = useState("");

  // lookup city by name -> id (to map free-text province to city id when possible)
  const citiesByName = useMemo(() => {
    const m = new Map();
    (citiesData || []).forEach((c) => {
      if (c && c.name) m.set(String(c.name).toLowerCase(), c._id);
    });
    return m;
  }, [citiesData]);
  // lookup city by id -> name for display
  const citiesById = useMemo(() => {
    const m = new Map();
    (citiesData || []).forEach((c) => {
      if (c && c._id) m.set(c._id, c.name);
    });
    return m;
  }, [citiesData]);
  // --------------------------------------------------------------------------
  // PRODUCT DATA PREPARATION
  // --------------------------------------------------------------------------

  // Build product lists once and enrich with `products.json` when codes match
  const productsByCode = useMemo(() => {
    const m = new Map();
    (productsData || []).forEach((p) => {
      if (p && p.code != null) m.set(String(p.code), p);
    });
    return m;
  }, []);

  // branches lookup (id -> branch)
  const branchesById = useMemo(() => {
    const m = new Map();
    (branchesData || []).forEach((b) => {
      if (b && b._id) m.set(b._id, b);
    });
    return m;
  }, []);

  const allMen = useMemo(() => {
    const items = buildItems(menImages, MEN);
    return items.map((it, idx) => {
      const p = productsByCode.get(String(it.code));
      if (p) {
        return {
          ...it,
          // keep canonical id unchanged so we don't manipulate product IDs
          id: p._id || it.id,
          _id: p._id,
          name: p.name || it.name,
          code: String(p.code),
        };
      }
      return it;
    });
  }, [productsByCode]);

  const allWomen = useMemo(() => {
    const items = buildItems(womenImages, WOMEN);
    return items.map((it, idx) => {
      const p = productsByCode.get(String(it.code));
      if (p) {
        return {
          ...it,
          id: p._id || it.id,
          _id: p._id,
          name: p.name || it.name,
          code: String(p.code),
        };
      }
      return it;
    });
  }, [productsByCode]);

  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------

  // UI state
  const [activeCategory, setActiveCategory] = useState(MEN);

  // Product selection state: map of itemId -> quantity
  const [selectedMen, setSelectedMen] = useState({});
  const [selectedWomen, setSelectedWomen] = useState({});

  // Offer and pricing state
  const [desiredCount, setDesiredCount] = useState(1);
  const [offerSize, setOfferSize] = useState(null);

  // Form and order state
  const [errorMessage, setErrorMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delivery state
  const [deliveryMethod, setDeliveryMethod] = useState("home"); // "home" or "pickup"
  const [selectedBranch, setSelectedBranch] = useState("");
  // video mute state
  const [isMuted, setIsMuted] = useState(true);

  // --------------------------------------------------------------------------
  // REFS
  // --------------------------------------------------------------------------

  const formRef = useRef(null);
  const videoRef = useRef(null);
  const targetCountRef = useRef(0);
  const selectedMenRef = useRef(selectedMen);
  const selectedWomenRef = useRef(selectedWomen);
  const autoUnmuteUsedRef = useRef(false);

  // --------------------------------------------------------------------------
  // CALCULATIONS & DERIVED STATE
  // --------------------------------------------------------------------------

  // Selection calculations (sum of quantities)
  const totalSelected =
    Object.values(selectedMen).reduce((s, v) => s + Number(v || 0), 0) +
    Object.values(selectedWomen).reduce((s, v) => s + Number(v || 0), 0);
  const targetCount = offerSize * Number(desiredCount || 0);
  const remaining = Math.max(targetCount - totalSelected, 0);

  // Price calculations
  const price = useMemo(() => {
    if (!offerSize) return 0;
    const cnt = Number(desiredCount || 0);
    const unitPrices = { 1: 499, 2: 649, 4: 849 };
    const unit = unitPrices[offerSize] || 250;
    return cnt * unit;
  }, [offerSize, desiredCount]);

  // Final price calculations
  // Delivery fee
  const delivery = deliveryMethod === "pickup" ? 0 : 100;

  // Pricing / Discount logic
  // Base per-item retail price (non-offer)
  const perItemPrice = 485;
  // Number of items in the selected offers (target count)
  const fullItemCount = targetCount;
  // Full retail price for all items (no offers)
  const fullRetailPrice = Number(fullItemCount || 0) * perItemPrice;
  // 'price' variable above represents the offer price (total for desiredCount)
  // Total discount is the difference between full retail and the offer price
  const discount = Math.max(0, fullRetailPrice - price);
  // Final discounted price is the offer price (price) after applying discount
  const discountedPrice = Math.max(0, price);
  const grandTotal = discountedPrice + (price > 0 ? delivery : 0);

  // --------------------------------------------------------------------------
  // EFFECTS
  // --------------------------------------------------------------------------

  // Keep refs in sync with state for stable callbacks
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

  // Sync video muted state and enable first-click unmute anywhere on the page
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = Boolean(isMuted);

    // Attach the one-time document click handler only while muted and only if it hasn't run before.
    if (!isMuted || autoUnmuteUsedRef.current) return;

    function handleFirstClick(e) {
      // ignore clicks originating from elements that opt-out (e.g. mute button)
      try {
        if (e && e.target && e.target.closest && e.target.closest('[data-no-auto-unmute]')) {
          return;
        }
      } catch (_) {}
      const vid = videoRef.current;
      if (vid && vid.muted) {
        try {
          vid.muted = false;
        } catch (_) {}
        setIsMuted(false);
        autoUnmuteUsedRef.current = true;
      }
      document.removeEventListener("click", handleFirstClick, { capture: true });
    }

    document.addEventListener("click", handleFirstClick, { capture: true, passive: true });
    return () => document.removeEventListener("click", handleFirstClick, { capture: true });
  }, [isMuted]);

  // Countdown to fixed target date (March 18, 2026)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });
  useEffect(() => {
    const target = new Date('2026-03-18T00:00:00');
    function update() {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      const s = Math.floor(diff / 1000);
      const days = Math.floor(s / 86400);
      const hours = Math.floor((s % 86400) / 3600);
      const minutes = Math.floor((s % 3600) / 60);
      const seconds = Math.floor(s % 60);
      setCountdown({ days, hours, minutes, seconds, expired: false });
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch countries and initial cities on mount, and load governments/cities when selections change
  useEffect(() => {
    const extractList = (res) => {
      if (!res) return [];
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.data)) return res.data.data;
      if (Array.isArray(res.data?.docs)) return res.data.docs;
      if (Array.isArray(res.data?.countries)) return res.data.countries;
      if (Array.isArray(res.data?.governments)) return res.data.governments;
      if (Array.isArray(res.data?.cities)) return res.data.cities;
      return [];
    };

    // initial load: countries + all cities (fallback)
    (async () => {
      try {
        const cRes = await fetchCountries();
        setCountriesData(extractList(cRes));
      } catch (err) {
        console.error("failed to load countries", err);
      }

      try {
        const allCities = await fetchCities();
        setCitiesData(extractList(allCities));
      } catch (err) {
        console.error("failed to load cities", err);
      }
    })();
  }, []);

  // When selected country changes, fetch its governments (governorates)
  useEffect(() => {
    if (!selectedCountry) {
      setGovernmentsData([]);
      return;
    }
    (async () => {
      try {
        const res = await fetchGovernorates({ country: selectedCountry });
        // try to extract array from response
        const list = res?.data?.data || res?.data?.docs || res?.data || [];
        setGovernmentsData(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("failed to load governments", err);
        setGovernmentsData([]);
      }
    })();
  }, [selectedCountry]);

  // set default country to Egypt (مصر) when countries load
  useEffect(() => {
    if (!countriesData || countriesData.length === 0) return;
    // try to find an entry whose name matches مصر or egypt (case-insensitive)
    const found = countriesData.find((c) => {
      const n = String(c.name || "").toLowerCase();
      return n.includes("مصر") || n.includes("egypt") || n.includes("egypt");
    });
    if (found) {
      const id = found._id || found.id || found.name;
      setSelectedCountry(id);
      // lock country to Egypt so user cannot change it
      setFixedCountry(found);
    }
  }, [countriesData]);

  // derive whether the selected country is Egypt-like
  const isEgyptSelected = useMemo(() => {
    if (!selectedCountry || !countriesData) return false;
    const sel = countriesData.find(
      (c) => c._id === selectedCountry || c.id === selectedCountry || c.name === selectedCountry
    );
    if (!sel) return false;
    const n = String(sel.name || "").toLowerCase();
    return n.includes("مصر") || n.includes("egypt");
  }, [selectedCountry, countriesData]);

  // When government selected, fetch cities for that government
  useEffect(() => {
    if (!selectedGovernment) return;
    (async () => {
      try {
        const res = await fetchCities({ government: selectedGovernment });
        const list = res?.data?.data || res?.data?.docs || res?.data || [];
        setCitiesData(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("failed to load cities for government", err);
      }
    })();
  }, [selectedGovernment]);

  // --------------------------------------------------------------------------
  // EVENT HANDLERS
  // --------------------------------------------------------------------------

  /**
   * Toggle product selection with offer limit enforcement
   * Uses refs to maintain stable function reference
   */
  const toggleItem = (itemId) => {
    const currentCategory = activeCategoryRef.current;
    if (!currentCategory) return;
    const isMen = currentCategory === MEN;
    if (isMen) {
      setSelectedMen((prev) => {
        const next = { ...prev };
        const currentTotal =
          Object.values(prev).reduce((s, v) => s + Number(v || 0), 0) +
          Object.values(selectedWomenRef.current).reduce(
            (s, v) => s + Number(v || 0),
            0
          );
        if (next[itemId]) {
          // remove item
          delete next[itemId];
          return next;
        }
        if (targetCountRef.current && currentTotal >= targetCountRef.current) {
          return prev;
        }
        next[itemId] = 1;
        return next;
      });
    } else {
      setSelectedWomen((prev) => {
        const next = { ...prev };
        const currentTotal =
          Object.values(selectedMenRef.current).reduce(
            (s, v) => s + Number(v || 0),
            0
          ) + Object.values(prev).reduce((s, v) => s + Number(v || 0), 0);
        if (next[itemId]) {
          delete next[itemId];
          return next;
        }
        if (targetCountRef.current && currentTotal >= targetCountRef.current) {
          return prev;
        }
        next[itemId] = 1;
        return next;
      });
    }
  };

  // increment/decrement quantity for an item (respecting targetCount)
  const changeItemQuantity = (itemId, delta, categoryParam) => {
    const currentCategory = categoryParam || activeCategoryRef.current;
    if (!currentCategory) return;
    const isMen = currentCategory === MEN;
    // debug log to help trace why quantity isn't updating
    try {
    } catch (_) {}
    if (isMen) {
      setSelectedMen((prev) => {
        const next = { ...prev };
        const currQty = Number(next[itemId] || 0);
        const totalOther =
          Object.values(selectedWomenRef.current).reduce(
            (s, v) => s + Number(v || 0),
            0
          ) +
          Object.values(prev).reduce((s, v) => s + Number(v || 0), 0) -
          currQty;
        const newQty = Math.max(0, currQty + delta);
        if (newQty === 0) {
          if (next[itemId]) delete next[itemId];
          // debug
          try {
          } catch (_) {}
          return next;
        }
        if (
          targetCountRef.current &&
          totalOther + newQty > targetCountRef.current
        ) {
          return prev;
        }
        next[itemId] = newQty;
        // debug
        try {
        } catch (_) {}
        return next;
      });
    } else {
      setSelectedWomen((prev) => {
        const next = { ...prev };
        const currQty = Number(next[itemId] || 0);
        const totalOther =
          Object.values(selectedMenRef.current).reduce(
            (s, v) => s + Number(v || 0),
            0
          ) +
          Object.values(prev).reduce((s, v) => s + Number(v || 0), 0) -
          currQty;
        const newQty = Math.max(0, currQty + delta);
        if (newQty === 0) {
          if (next[itemId]) delete next[itemId];
          // debug
          try {
          } catch (_) {}
          return next;
        }
        if (
          targetCountRef.current &&
          totalOther + newQty > targetCountRef.current
        ) {
          return prev;
        }
        next[itemId] = newQty;
        // debug
        try {
        } catch (_) {}
        return next;
      });
    }
  };

  /**
   * Scroll to order form when user clicks "Order Now"
   */
  const handleOrderNow = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /**
   * Handle order form submission
   * Validates form data and shows confirmation modal
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous errors

    // Require choosing an offer first
    if (!offerSize) {
      setErrorMessage("رجاءً اختر نوع العرض أولاً");
      return;
    }

    // Check if items are selected first
    if (totalSelected === 0) {
      setErrorMessage("رجاءً اختر العطور أولاً");
      return;
    }

    if (totalSelected !== targetCount) {
      setErrorMessage("رجاءً أكمل اختيار العطور بحسب العرض");
      return;
    }

    const form = e.target;
    const formData = new FormData(form);
    const customerName = (formData.get("customerName") || "").trim();
    const phone = (formData.get("phone") || "").trim();
    const altPhone = (formData.get("altPhone") || "").trim();
    const notes = (formData.get("notes") || "").trim();

    // Validate customer name
    if (!customerName || customerName.length < 3) {
      setErrorMessage("رجاءً أدخل اسمك الكامل (3 أحرف على الأقل)");
      return;
    }

    // Validate Egyptian phone number (must start with 01 and be 11 digits)
    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (!phone || !phoneRegex.test(phone)) {
      setErrorMessage(
        "رجاءً أدخل رقم هاتف مصري صحيح (يبدأ بـ 01 ويتكون من 11 رقم)"
      );
      return;
    }

    let cityId = "";
    let address = "";
    let branch = "";

    if (deliveryMethod === "pickup") {
      // Validate branch selection
      branch = selectedBranch;
      if (!branch) {
        setErrorMessage("رجاءً اختر الفرع الذي تريد الاستلام منه");
        return;
      }
    } else {
      // Validate home delivery fields
      cityId = (formData.get("city") || "").trim();
      // if country is not Egypt, city/government may be disabled — only require city when Egypt is selected
      const selectedCountryObj = (countriesData || []).find(
        (c) => c._id === selectedCountry || c.id === selectedCountry || c.name === selectedCountry
      );
      const countryName = String(selectedCountryObj?.name || "").toLowerCase();
      const requireCity = countryName.includes("مصر") || countryName.includes("egypt");
      address = (formData.get("address") || "").trim();

      if (requireCity && !cityId) {
        setErrorMessage("رجاءً اختر المحافظة من القائمة");
        return;
      }

      if (!address || address.length < 10) {
        setErrorMessage("رجاءً أدخل عنوان تفصيلي (10 أحرف على الأقل)");
        return;
      }
    }

    // Build selected items array with basic metadata and quantities
    const findItem = (id) =>
      allMen.find((i) => i.id === id) || allWomen.find((i) => i.id === id);
    const items = [];
    Object.entries(selectedMen).forEach(([id, qty]) => {
      const it = findItem(id);
      items.push(
        it
          ? {
              id: it.id,
              name: it.code || it.originalName || it.name,
              code: it.code || null,
              image: it.image,
              category: it.category,
              quantity: Number(qty || 0),
            }
          : { id, quantity: Number(qty || 0) }
      );
    });
    Object.entries(selectedWomen).forEach(([id, qty]) => {
      const it = findItem(id);
      items.push(
        it
          ? {
              id: it.id,
              name: it.code || it.originalName || it.name,
              code: it.code || null,
              image: it.image,
              category: it.category,
              quantity: Number(qty || 0),
            }
          : { id, quantity: Number(qty || 0) }
      );
    });

    const totalItemsCount = items.reduce(
      (s, it) => s + Number(it.quantity || 0),
      0
    );

    const order = {
      customerName,
      phone,
      altPhone: altPhone || null,
      deliveryMethod,
      branchId: deliveryMethod === "pickup" ? branch : null,
      branchName:
        deliveryMethod === "pickup"
          ? branchesById.get(branch)?.name || null
          : null,
      // always include country; government and city are included only when Egypt is selected,
      // otherwise they are sent as empty strings per requirement
      country: selectedCountry || "",
      government:
        deliveryMethod === "home" && isEgyptSelected ? selectedGovernment || "" : "",
      city: deliveryMethod === "home" && isEgyptSelected ? cityId || "" : "",
      cityName:
        deliveryMethod === "home" && isEgyptSelected ? citiesById.get(cityId) || "" : "",
      address: deliveryMethod === "home" ? address : null,
      notes,
      items,
      offerSize,
      desiredCount,
      totalItems: totalItemsCount,
      price: fullRetailPrice,
      // discount = fullRetailPrice - offerPrice (what customer saves)
      discount,
      // discountedPrice = offer price (what customer pays for products)
      discountedPrice: price,
      delivery,
      grandTotal,
      form,
    };

    // Show confirmation modal instead of submitting directly
    setPendingOrder(order);
    setShowModal(true);
  };

  /**
   * Confirm and submit order to backend
   * Sends order data via API and shows success/error feedback
   */
  const handleConfirmOrder = async () => {
    if (!pendingOrder) return;

    setIsSubmitting(true);
    try {
      // Build payload matching backend schema from pendingOrder
      // build items for backend (product id + quantity)
      const items = (pendingOrder.items || []).map((it) => ({
        product: it._id || it.id || it.code || it.name,
        quantity: String(it.quantity || 1),
      }));

      // use selected city id directly from pendingOrder
      const cityId = pendingOrder.city || "";

      // build lead payload (first request)
      // Only include fields expected by the lead endpoint. Do NOT include order-only fields here
      const leadPayload = {
        name: pendingOrder.customerName,
        phone: pendingOrder.phone,
        otherPhones: pendingOrder.altPhone ? [pendingOrder.altPhone] : [],
        addresses: [
          {
            area: "",
            street: pendingOrder.address || "",
            landmark: "",
          },
        ],
        company: DEFAULT_COMPANY_ID,
        subCategories: DEFAULT_SUBCATS,
        isWhatsapp: false,
        // include branch only when delivery method is pickup
        ...(pendingOrder.deliveryMethod === "pickup" && pendingOrder.branchId
          ? { branch: pendingOrder.branchId }
          : {}),
      };

      // Include location fields in the lead payload per backend expectations.
      // Always include country (as selected). Include government and city only when available.
      if (pendingOrder.country) {
        leadPayload.country = pendingOrder.country;
      }
      if (pendingOrder.deliveryMethod === "home" && pendingOrder.government) {
        leadPayload.government = pendingOrder.government;
      }
      // include city only when present to avoid sending empty strings
      if (pendingOrder.deliveryMethod === "home" && cityId) {
        leadPayload.city = cityId;
      }

      // compute monetary values for the order payload using backend field names
      const subTotalValue = Number(pendingOrder.price ?? 0); // full retail before discounts
      const totalDiscountValue = Number(pendingOrder.discount ?? 0);
      // if an offer is selected, shipping is free as part of the offer
      const shippingFeeValue = pendingOrder.offerSize ? 0 : Number(pendingOrder.delivery ?? 0);
      const discountedPriceValue = Number(pendingOrder.discountedPrice ?? pendingOrder.price ?? 0);
      const totalValue = discountedPriceValue + shippingFeeValue;

      // build order payload (second request) — lead id will be set after lead creation
      // Use backend-expected numeric field names: subTotal, total, totalDiscount, shippingFee
      const orderPayload = {
        lead: "<LEAD_ID_PLACEHOLDER>",
        company: DEFAULT_COMPANY_ID,
        // Do not send `subTotal` or `total` — backend computes these and rejects them on create
        totalDiscount: String(totalDiscountValue),
        shippingFee: String(shippingFeeValue),
        items: items.map((it) => ({
          item: it.product,
          quantity: String(it.quantity),
        })),
        // include branch only when pickup
        ...(pendingOrder.deliveryMethod === "pickup" && pendingOrder.branchId
          ? { branch: pendingOrder.branchId }
          : {}),
      };

      // Combine lead + order fields into single payload expected by `addOrder`
      const payload = {
        ...leadPayload,
        // items should use `item` key according to example
        items: items.map((it) => ({
          item: it.product,
          quantity: String(it.quantity),
        })),
        // shipping and discount values are allowed at top-level and will be moved to order by addOrder
        shippingFee: String(shippingFeeValue),
        totalDiscount: String(totalDiscountValue),
        company: DEFAULT_COMPANY_ID,
        // place the customer's note and order-only numeric fields inside `orderOnly` so they are not sent to lead
        orderOnly: {
          userNote: pendingOrder.notes || null,
          // Only include allowed order-only fields. Do NOT include `subTotal` or `total` — backend calculates them.
          totalDiscount: String(totalDiscountValue),
          shippingFee: String(shippingFeeValue),
        },
        // include `branch` only when pickup
        ...(pendingOrder.deliveryMethod === "pickup" && {
          branch: pendingOrder.branchId || "",
        }),
      };

      // ensure branch is not present if empty or falsy (avoids validation error)
      if (
        "branch" in payload &&
        (!payload.branch || String(payload.branch).trim() === "")
      ) {
        delete payload.branch;
      }

      // Keep `country`, `government`, and `city` in the payload according to selection rules:
      // - `country` is always sent as selected
      // - if country is Egypt, `government` and `city` contain the selected values
      // - if country is not Egypt, `government` and `city` are sent as empty strings
      // (Do not delete them here so backend receives explicit empty values when required.)

      // Debug: log payload being sent to backend so we can inspect disallowed fields
      try {
        // eslint-disable-next-line no-console
        console.log("Submitting payload to addOrder:", payload);
      } catch (_) {}

      // Submit to backend
      const result = await addOrder(payload);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `تم إنشاء الطلب بنجاح`,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      // Close modal and reset UI state as if submitted
      setShowModal(false);
      setPendingOrder(null);
      setErrorMessage("");

      // clear selections and form
      setSelectedMen(new Set());
      setSelectedWomen(new Set());
      if (pendingOrder.form) {
        pendingOrder.form.reset();
      }
    } catch (err) {
      // Print server validation details when available
      try {
        // eslint-disable-next-line no-console
        console.error("Order submission error response:", err?.response?.data || err);
      } catch (_) {}
      setErrorMessage("حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.");
      setShowModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <div
      dir="rtl"
      className="min-h-svh bg-linear-to-br from-amber-50 via-white to-orange-50 text-neutral-900"
    >
      {/* ================================================================
          HEADER - Sticky navigation bar with logo
          ================================================================ */}
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
              <div className="font-bold text-lg bg-linear-to-r from-[#be9f4e] to-[#8b7038] bg-clip-text text-transparent">
                ASIA
              </div>
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

      {/* ================================================================
          MAIN CONTENT - Product showcase and order form
          ================================================================ */}
      <main className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ----------------------------------------
            VIDEO SECTION
            ---------------------------------------- */}
        <section className="space-y-4">
          <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-black">
            <video
              ref={videoRef}
              src={productVideo}
              className="w-full h-auto"
              loop
              muted={isMuted}
              playsInline
              autoPlay
            />

            {/* Mute/unmute button overlay */}
            <button
              type="button"
              aria-pressed={!isMuted}
              onClick={(e) => {
                e.stopPropagation();
                const next = !isMuted;
                setIsMuted(next);
                try {
                  if (videoRef.current) videoRef.current.muted = next;
                } catch (_) {}
              }}
              data-no-auto-unmute
              className="absolute top-3 left-3 z-20 bg-white/90 text-neutral-800 rounded-full p-2 shadow-md hover:scale-105 transition-transform"
              title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume className="w-4 h-4" />}
            </button>
          </div>
        </section>

        {/* ----------------------------------------
            PRODUCT DETAILS & SELECTOR SECTION
            ---------------------------------------- */}
        <section className="space-y-5">
          {/* Product title and rating */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold bg-linear-to-r from-[#be9f4e] via-[#d4af37] to-[#be9f4e] bg-clip-text text-transparent animate-pulse">
                عطور مميزة
              </h1>
              <Heart className="w-6 h-6 text-red-500 fill-red-500 animate-pulse" />
            </div>

            {/* Product rating display */}
            <div className="flex items-center gap-3 bg-linear-to-r from-amber-50 to-orange-50 rounded-lg px-4 py-3 border border-amber-200 shadow-md">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((star) => (
                  <Star
                    key={star}
                    className="w-5 h-5 text-amber-500 fill-amber-500"
                  />
                ))}
                <Star
                  className="w-5 h-5 text-amber-500 fill-amber-500"
                  style={{ clipPath: "inset(0 80% 0 0)" }}
                />
                <Star
                  className="w-5 h-5 text-amber-500"
                  style={{ clipPath: "inset(0 0 0 20%)" }}
                />
              </div>
              <span className="text-2xl font-bold text-amber-700">4.2</span>
              <span className="text-sm text-amber-600">من 5</span>
              <span className="text-xs text-neutral-500 mr-auto">
                (٢٤٥+ تقييم)
              </span>
            </div>

            {/* Countdown banner for free-shipping offer */}
            <div className="mt-3">
              <div className="inline-flex items-center gap-3 bg-yellow-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl">
                <div className="font-semibold">العرض الشحن المجاني ينتهي في</div>
                <div className="font-mono font-bold text-neutral-800">
                  {countdown.expired
                    ? "انتهى العرض"
                    : `${countdown.days} يوم ${String(countdown.hours).padStart(2,'0')}:${String(countdown.minutes).padStart(2,'0')}:${String(countdown.seconds).padStart(2,'0')}`}
                </div>
              </div>
            </div>

            {/* Product description */}
            <p className="text-sm text-neutral-600 leading-relaxed">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                استمتع بتجربة عطرية فاخرة
              </span>
              . اختر عطورك المفضلة من تشكيلتنا الرجالية والنسائية، مع عروض مميزة
              لتوفير أكبر.
            </p>

            {/* Usage instructions */}
            <div className="text-red-600 text-xs">
              ملاحظة: اختر نوع العرض أولاً ثم حدد عدد هذه العروض باستخدام العداد
              أسفل الصفحة.
            </div>

            {/* Offer size selection buttons */}
            <div className="mt-2 w-full flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setOfferSize(1)}
                className={
                  "flex flex-col items-center px-4 py-3 rounded-xl text-sm text-center transition-all duration-300 transform hover:scale-105 " +
                  (offerSize === 1
                    ? "bg-linear-to-br from-[#be9f4e] to-[#8b7038] text-white shadow-lg ring-2 ring-amber-300 ring-offset-2"
                    : "bg-white text-neutral-700 border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50 shadow-md")
                }
                aria-pressed={offerSize === 1}
              >
                <span className="font-bold text-base">🎁 عرض 1</span>
                <span
                  className={
                    "text-xs " +
                    (offerSize === 1 ? "text-amber-100" : "text-neutral-500")
                  }
                >
                  1 عطر — 499 جنيه
                </span>
              </button>
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
                <span
                  className={
                    "text-xs " +
                    (offerSize === 2 ? "text-amber-100" : "text-neutral-500")
                  }
                >
                  2 عطور — 649 جنيه
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
                <span
                  className={
                    "text-xs " +
                    (offerSize === 4 ? "text-amber-100" : "text-neutral-500")
                  }
                >
                  4 عطور — 849 جنيه
                </span>
              </button>
            </div>
          </div>

          {/* Order Now button */}
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

          {/* Category tabs and selection counter */}
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

          {/* ----------------------------------------
              PRODUCT GRID
              Both categories rendered, toggled with CSS
              ---------------------------------------- */}
          {!activeCategory ? (
            <div className="py-8 text-center text-neutral-500">
              اختر فئة "رجالي" أو "نسائي" لعرض العطور
            </div>
          ) : null}

          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 ${
              activeCategory === MEN ? "" : "hidden"
            }`}
          >
            {allMen.map((item, idx) => {
              const selected = Boolean(selectedMen[item.id]);
              const disabled =
                !selected && targetCount && totalSelected >= targetCount;
              return (
                <div
                  key={`${item._id || item.id}-${idx}-${item.category}`}
                  className="col-span-1"
                >
                  <ProductCard
                    item={item}
                    selected={selected}
                    disabled={disabled}
                    onToggle={toggleItem}
                    quantity={selectedMen[item.id] || 0}
                    onInc={() => changeItemQuantity(item.id, 1, "men")}
                    onDec={() => changeItemQuantity(item.id, -1, "men")}
                  />
                </div>
              );
            })}
          </div>

          {/* Women's products grid */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 ${
              activeCategory === WOMEN ? "" : "hidden"
            }`}
          >
            {allWomen.map((item, idx) => {
              const selected = Boolean(selectedWomen[item.id]);
              const disabled =
                !selected && targetCount && totalSelected >= targetCount;
              return (
                <div
                  key={`${item._id || item.id}-${idx}-${item.category}`}
                  className="col-span-1"
                >
                  <ProductCard
                    item={item}
                    selected={selected}
                    disabled={disabled}
                    onToggle={toggleItem}
                    quantity={selectedWomen[item.id] || 0}
                    onInc={() => changeItemQuantity(item.id, 1, "women")}
                    onDec={() => changeItemQuantity(item.id, -1, "women")}
                  />
                </div>
              );
            })}
          </div>

          {/* ----------------------------------------
              ORDER FORM
              Customer details and delivery info
              ---------------------------------------- */}
          <form
            ref={formRef}
            className="rounded-2xl border-2 border-amber-300 bg-linear-to-br from-white to-amber-50 p-6 space-y-4 shadow-xl"
            onSubmit={handleSubmit}
          >
            <h2 className="text-2xl font-bold bg-linear-to-r from-[#be9f4e] to-[#8b7038] bg-clip-text text-transparent flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-[#be9f4e]" />
              تأكيد الطلب
            </h2>

            {/* Delivery method selection (home delivery or pickup) */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-neutral-700">
                طريقة الاستلام
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMethod("home");
                    setSelectedBranch("");
                  }}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 ${
                    deliveryMethod === "home"
                      ? "bg-linear-to-br from-[#be9f4e] to-[#8b7038] text-white shadow-lg ring-2 ring-amber-300"
                      : "bg-white text-neutral-700 border-2 border-amber-200 hover:border-amber-400"
                  }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  شحن للمنزل
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("pickup")}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 ${
                    deliveryMethod === "pickup"
                      ? "bg-linear-to-br from-[#be9f4e] to-[#8b7038] text-white shadow-lg ring-2 ring-amber-300"
                      : "bg-white text-neutral-700 border-2 border-amber-200 hover:border-amber-400"
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                  استلام من الفرع
                </button>
              </div>
            </div>

            {/* Customer information inputs */}
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

              <div className="space-y-1">
                <label className="text-sm text-neutral-700">
                  رقم هاتف احتياطي (اختياري)
                </label>
                <input
                  name="altPhone"
                  type="tel"
                  pattern="01[0125][0-9]{8}"
                  minLength={11}
                  maxLength={11}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#be9f4e]"
                  placeholder="01XXXXXXXXX"
                  title="رقم احتياطي (اختياري)"
                />
              </div>

              {/* Conditional delivery/pickup fields (render only the active panel to avoid overlap) */}
              <div className="sm:col-span-2">
                {deliveryMethod === "pickup" ? (
                  <div className="space-y-2">
                    <label className="text-sm text-neutral-700 font-semibold">اختر الفرع</label>
                    <select
                      required
                      name="branch"
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full rounded-lg border-2 border-amber-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#be9f4e] bg-white"
                    >
                      <option value="">-- اختر الفرع --</option>
                      {(branchesData || []).map((b) => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      {fixedCountry ? (
                        <div>
                          <label className="text-sm text-neutral-700">الدولة</label>
                          <input type="hidden" name="country" value={fixedCountry._id || fixedCountry.id || fixedCountry.name} />
                          <div className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-gray-100 text-neutral-700">{fixedCountry.name}</div>
                        </div>
                      ) : (
                        <select
                          required
                          name="country"
                          value={selectedCountry}
                          onChange={(e) => { setSelectedCountry(e.target.value); setSelectedGovernment(""); setCitiesData([]); }}
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#be9f4e] bg-white"
                        >
                          <option value="">-- اختر الدولة --</option>
                          {(countriesData || [])
                            .filter((c) => {
                              const name = String(c?.name || "").trim().toLowerCase();
                              // hide countries named 'غير محدد' or 'اونلاين'
                              if (!name) return false;
                              if (name.includes("غير محدد")) return false;
                              if (name.includes("اونلاين")) return false;
                              return true;
                            })
                            .map((c) => (
                              <option key={c._id || c.id || c.name} value={c._id || c.id || c.name}>{c.name}</option>
                            ))}
                        </select>
                      )}
                    </div>

                    {isEgyptSelected ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-neutral-700">المحافظة</label>
                          <select
                            name="government"
                            value={selectedGovernment}
                            onChange={(e) => setSelectedGovernment(e.target.value)}
                            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#be9f4e] bg-white border-neutral-300"
                          >
                            <option value="">-- اختر المحافظة --</option>
                            {(governmentsData || []).map((g) => (
                              <option key={g._id || g.id || g.name} value={g._id || g.id || g.name}>{g.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-sm text-neutral-700">المدينة</label>
                          <select
                            required
                            name="city"
                            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#be9f4e] bg-white border-neutral-300"
                          >
                            <option value="">-- اختر المدينة --</option>
                            {(citiesData || []).map((c) => (
                              <option key={c._id || c.id || c.name} value={c._id || c.id || c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : null}

                    <div>
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
                  </div>
                )}
              </div>

              {/* Order notes textarea */}
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

            {/* Price summary */}
            <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-sm">
              {/* Offer breakdown removed from UI per request */}
              <div className="flex items-center justify-between">
                <span>سعر العطور</span>
                <span>{price ? `${discountedPrice} جنيه` : "—"}</span>
              </div>
              {/* <div className="flex items-center justify-between text-red-600">
                <span>الخصم</span>
                <span>-{discount ? `${discount} جنيه` : "0 جنيه"}</span>
              </div> */}
              <div className="flex items-center justify-between text-gray-500">
                <span>سعر التوصيل</span>
                <span>{delivery} جنيه</span>
              </div>
              <div className="flex items-center justify-between">
                <span>سعر التوصيل بعد العرض</span>
                <span>مجانا</span>
              </div>
              {/* <div className="flex items-center justify-between font-bold border-t mt-2 pt-2">
                <span>الإجمالي</span>
                <span>{grandTotal ? `${grandTotal} جنيه` : "—"}</span>
              </div> */}
              <div className="flex items-center justify-between font-bold border-t mt-2 pt-2">
                <span>الإجمالي</span>
                <span>{discountedPrice ? `${discountedPrice} جنيه` : "—"}</span>
              </div>
            </div>

            {/* Error message display */}
            {errorMessage && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-start gap-3 animate-pulse">
                <div className="bg-red-500 rounded-full p-1 mt-0.5">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <p className="text-red-700 font-semibold text-sm flex-1">
                  {errorMessage}
                </p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="w-full px-6 py-3 rounded-xl bg-linear-to-r from-green-500 to-emerald-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              تأكيد الطلب
              <Sparkles className="w-5 h-5" />
            </button>
          </form>
        </section>
      </main>

      {/* ================================================================
          CONFIRMATION MODAL
          Shows order summary before final submission
          ================================================================ */}
      {showModal && pendingOrder && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-linear-to-r from-[#be9f4e] to-[#8b7038] text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingBag className="w-6 h-6" />
                  تأكيد الطلب
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  disabled={isSubmitting}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Customer Info */}
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h3 className="font-bold text-lg mb-3 text-amber-900">
                  معلومات العميل
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-neutral-700 min-w-20">
                      الاسم:
                    </span>
                    <span className="text-neutral-900">
                      {pendingOrder.customerName}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-neutral-700 min-w-20">
                      الهاتف:
                    </span>
                    <span className="text-neutral-900" dir="ltr">
                      {pendingOrder.phone}
                    </span>
                  </div>
                  {pendingOrder.altPhone && (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-neutral-700 min-w-20">
                        هاتف احتياطي:
                      </span>
                      <span className="text-neutral-900" dir="ltr">
                        {pendingOrder.altPhone}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-neutral-700 min-w-20">
                      طريقة الاستلام:
                    </span>
                    <span className="text-neutral-900">
                      {pendingOrder.deliveryMethod === "pickup"
                        ? "استلام من الفرع"
                        : "شحن للمنزل"}
                    </span>
                  </div>
                  {pendingOrder.deliveryMethod === "pickup" &&
                    pendingOrder.branchName && (
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-neutral-700 min-w-20">
                          الفرع:
                        </span>
                        <span className="text-neutral-900">
                          {pendingOrder.branchName}
                        </span>
                      </div>
                    )}
                  {pendingOrder.deliveryMethod === "home" && (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-neutral-700 min-w-20">
                          المحافظة:
                        </span>
                        <span className="text-neutral-900">
                          {pendingOrder.cityName || pendingOrder.city || "-"}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-neutral-700 min-w-20">
                          العنوان:
                        </span>
                        <span className="text-neutral-900">
                          {pendingOrder.address}
                        </span>
                      </div>
                    </>
                  )}
                  {pendingOrder.notes && (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-neutral-700 min-w-20">
                        ملاحظات:
                      </span>
                      <span className="text-neutral-900">
                        {pendingOrder.notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Details */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="font-bold text-lg mb-3 text-green-900">
                  تفاصيل الطلب
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-700">نوع العرض:</span>
                    <span className="font-semibold text-neutral-900">
                      {pendingOrder.offerSize} عطور
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-700">عدد العروض:</span>
                    <span className="font-semibold text-neutral-900">
                      {pendingOrder.desiredCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-700">إجمالي العطور:</span>
                    <span className="font-semibold text-neutral-900">
                      {pendingOrder.totalItems || pendingOrder.items.length} عطر
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected Items Preview */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-bold text-lg mb-3 text-blue-900">
                  العطور المختارة
                </h3>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {pendingOrder.items.map((item, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={getLowResUrl(item.image, 120, 10)}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        className="w-full h-16 object-cover rounded-lg border border-blue-300"
                      />
                      <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                        {item.quantity || 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                <h3 className="font-bold text-lg mb-3">الملخص المالي</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-700">سعر العطور:</span>
                    <span className="font-semibold">
                      {pendingOrder.discountedPrice ?? pendingOrder.price} جنيه
                    </span>
                  </div>
                  {/* {pendingOrder.discount ? (
                    <div className="flex justify-between text-red-600">
                      <span className="text-neutral-700">الخصم:</span>
                      <span className="font-semibold">
                        -{pendingOrder.discount} جنيه
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-red-600">
                      <span className="text-neutral-700">الخصم:</span>
                      <span className="font-semibold">0 جنيه</span>
                    </div>
                  )} */}
                  <div className="flex justify-between">
                    <span className="text-neutral-700">سعر التوصيل:</span>
                    <span className="font-semibold">
                      {pendingOrder.delivery} جنيه
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-300 pt-2 mt-2">
                    <span className="font-bold text-lg">الإجمالي:</span>
                    <span className="font-bold text-xl text-green-600">
                      {pendingOrder.discountedPrice ?? pendingOrder.grandTotal} جنيه
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-neutral-50 rounded-b-2xl flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 rounded-xl bg-white border-2 border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-100 transition-colors"
                disabled={isSubmitting}
              >
                تعديل
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 rounded-xl bg-linear-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    تأكيد نهائي
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          STICKY BOTTOM BAR
          Offer counter and quick order button
          ================================================================ */}
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

      {/* ================================================================
          FOOTER
          Brand info, locations, and contact details
          ================================================================ */}
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
                  <h3 className="text-2xl font-bold bg-linear-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                    ASIA
                  </h3>
                  <p className="text-xs text-amber-300">عطور فاخرة منذ سنوات</p>
                </div>
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed">
                نقدم لك أرقى العطور الرجالية والنسائية بأفضل الأسعار. جودة عالية
                وخدمة متميزة.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <Star
                  className="w-4 h-4 text-amber-400 fill-amber-400"
                  style={{ clipPath: "inset(0 80% 0 0)" }}
                />
                <span className="text-xs text-amber-300 mr-2">4.2 من 5</span>
              </div>
            </div>

            {/* Locations Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-amber-300">
                <MapPin className="w-5 h-5" />
                فروعنا
              </h3>
              <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors border border-white/10">
                <ul className="space-y-2 text-neutral-300 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>طنطا — شارع نادي المعلمين بجانب بوابة نادي طنطا</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>طنطا — شارع سعيد تقاطع شارع محب</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>طنطا — شارع الأشرف مول أوت ليت</span>
                  </li>
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
                    <div className="text-amber-200 font-medium">
                      +20 10 99949245
                    </div>
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
                    <div className="text-green-300 font-medium">
                      +20 10 90988215
                    </div>
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
                    <div className="text-blue-300 font-medium text-xs">
                      asiaaegy@gmail.com
                    </div>
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
                    <div className="text-purple-300 font-medium">
                      asiaegy.com
                    </div>
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
                <span>
                  جميع الحقوق محفوظة © {new Date().getFullYear()} ASIA
                </span>
              </div>
              <div className="flex items-center gap-2 text-neutral-400">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span className="text-xs">
                  21 شارع نادي المعلمين، طنطا، مصر
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
