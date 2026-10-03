"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Product } from "../lib/store-data";
import { inventoryRowToProduct, type InventoryProductRow } from "../lib/store-product";
import { createClient } from "../lib/supabase/client";

export type CartLine = { product: Product; quantity: number };
export type CartSyncStatus = "guest" | "syncing" | "synced" | "unavailable";
type CartContextValue = {
  items: CartLine[];
  ready: boolean;
  syncStatus: CartSyncStatus;
  addItem: (product: Product) => void;
  setQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
};

const STORAGE_KEY = "caribbean-star-store-cart-v1";
const STORAGE_USER_KEY = "caribbean-star-store-cart-user-v1";
const STORAGE_SYNCED_USER_KEY = "caribbean-star-store-cart-synced-user-v1";
const MAX_QUANTITY = 99;
const productIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CartContext = createContext<CartContextValue | null>(null);

function readCartStorage(key: string) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

function writeCartStorage(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* Keep the current in-memory cart. */ }
}

function removeCartStorage(key: string) {
  try { window.localStorage.removeItem(key); } catch { /* Keep the current in-memory cart. */ }
}

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<Product>;
  const validId = typeof product.id === "string"
    ? productIdPattern.test(product.id)
    : typeof product.id === "number" && Number.isInteger(product.id);
  return validId &&
    typeof product.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(product.slug) &&
    typeof product.name === "string" &&
    typeof product.category === "string" &&
    typeof product.price === "number" && Number.isFinite(product.price) && product.price >= 0 &&
    typeof product.currency === "string" && /^[A-Z]{3}$/.test(product.currency) &&
    typeof product.currencyMinorUnit === "number" && Number.isInteger(product.currencyMinorUnit) && product.currencyMinorUnit >= 0 && product.currencyMinorUnit <= 4 &&
    typeof product.rating === "number" && typeof product.reviews === "number" &&
    typeof product.image === "string" && (product.image.startsWith("/") || product.image.startsWith("https://")) &&
    typeof product.inStock === "boolean" &&
    (product.quantityAvailable === undefined || (Number.isInteger(product.quantityAvailable) && product.quantityAvailable >= 0)) &&
    typeof product.description === "string";
}

function readCart(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.flatMap((entry: unknown) => {
      if (!entry || typeof entry !== "object") return [];
      const line = entry as Partial<CartLine>;
      if (!isProduct(line.product) || typeof line.quantity !== "number" || !Number.isInteger(line.quantity)) return [];
      const stockLimit = line.product.quantityAvailable ?? MAX_QUANTITY;
      const quantity = Math.min(MAX_QUANTITY, stockLimit, line.quantity);
      return line.product.inStock && quantity > 0 ? [{ product: line.product, quantity }] : [];
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<CartSyncStatus>("guest");
  const [signedInUserId, setSignedInUserId] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const hydrationRun = useRef(0);
  const writeRevision = useRef(0);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let active = true;

    async function hydrateCart(userId: string | null) {
      const run = ++hydrationRun.current;
      const storedOwner = readCartStorage(STORAGE_USER_KEY);
      const storedSyncedOwner = readCartStorage(STORAGE_SYNCED_USER_KEY);
      const localCart = storedOwner === null || (storedOwner === userId && storedSyncedOwner !== userId)
        ? readCart()
        : [];

      if (!userId) {
        userIdRef.current = null;
        setSignedInUserId(null);
        if (storedOwner) {
          removeCartStorage(STORAGE_KEY);
          removeCartStorage(STORAGE_USER_KEY);
          removeCartStorage(STORAGE_SYNCED_USER_KEY);
          setItems([]);
        } else {
          setItems(localCart);
        }
        setSyncStatus("guest");
        setReady(true);
        return;
      }

      if (userIdRef.current && userIdRef.current !== userId) {
        userIdRef.current = null;
        setSignedInUserId(null);
      }
      if (storedOwner && storedOwner !== userId) {
        removeCartStorage(STORAGE_KEY);
        removeCartStorage(STORAGE_USER_KEY);
        removeCartStorage(STORAGE_SYNCED_USER_KEY);
        setItems([]);
      }
      setSyncStatus("syncing");

      const { data: savedRows, error: savedError } = await supabase
        .from("cart_items")
        .select("product_id, quantity")
        .eq("user_id", userId);
      if (!active || run !== hydrationRun.current) return;

      if (savedError) {
        setItems(localCart);
        setSyncStatus("unavailable");
        setReady(true);
        return;
      }

      const localQuantities = new Map<string, number>();
      if (storedOwner === null || (storedOwner === userId && storedSyncedOwner !== userId)) {
        for (const line of localCart) {
          if (typeof line.product.id === "string" && productIdPattern.test(line.product.id)) {
            localQuantities.set(line.product.id, line.quantity);
          }
        }
      }
      const savedQuantities = new Map<string, number>();
      for (const row of savedRows || []) {
        if (productIdPattern.test(row.product_id) && Number.isInteger(row.quantity) && row.quantity > 0) {
          savedQuantities.set(row.product_id, Math.min(MAX_QUANTITY, row.quantity));
        }
      }

      const productIds = [...new Set([...localQuantities.keys(), ...savedQuantities.keys()])];
      let productRows: InventoryProductRow[] = [];
      if (productIds.length) {
        const { data, error } = await supabase
          .from("inventory_items")
          .select("id, slug, name, category_key, price, currency, quantity_available, image_url, description")
          .in("id", productIds)
          .eq("status", "published");
        if (!active || run !== hydrationRun.current) return;
        if (error) {
          setItems(localCart);
          setSyncStatus("unavailable");
          setReady(true);
          return;
        }
        productRows = (data || []) as InventoryProductRow[];
      }

      const mergedItems = productRows.flatMap((row) => {
        const product = inventoryRowToProduct(row);
        const savedQuantity = savedQuantities.get(row.id) || 0;
        const localQuantity = localQuantities.get(row.id) || 0;
        const requested = storedOwner === null
          ? savedQuantity + localQuantity
          : Math.max(savedQuantity, localQuantity);
        const quantity = Math.min(MAX_QUANTITY, product.quantityAvailable ?? MAX_QUANTITY, requested);
        return product.inStock && quantity > 0 ? [{ product, quantity }] : [];
      });

      userIdRef.current = userId;
      writeCartStorage(STORAGE_USER_KEY, userId);
      setSignedInUserId(userId);
      setItems(mergedItems);
      setSyncStatus("syncing");
      setReady(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        window.setTimeout(() => {
          if (active) void hydrateCart(session?.user.id || null);
        }, 0);
      }
    });

    void supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (active && !error) void hydrateCart(user?.id || null);
      else if (active) {
        setSyncStatus("unavailable");
        setReady(true);
      }
    });

    return () => {
      active = false;
      hydrationRun.current += 1;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      if (signedInUserId) window.localStorage.setItem(STORAGE_USER_KEY, signedInUserId);
      else if (syncStatus === "guest") removeCartStorage(STORAGE_USER_KEY);
    } catch {
      // The cart still works for this page if browser storage is unavailable.
    }
  }, [items, ready, signedInUserId, syncStatus]);

  useEffect(() => {
    if (!ready || !signedInUserId) return;
    const userId = signedInUserId;
    const revision = ++writeRevision.current;
    const rows = items.flatMap(({ product, quantity }) =>
      typeof product.id === "string" && productIdPattern.test(product.id) && quantity > 0
        ? [{ user_id: userId, product_id: product.id, quantity: Math.min(MAX_QUANTITY, quantity) }]
        : []
    );
    const productIds = rows.map((row) => row.product_id);
    removeCartStorage(STORAGE_SYNCED_USER_KEY);
    setSyncStatus("syncing");

    writeQueue.current = writeQueue.current.catch(() => undefined).then(async () => {
      if (userIdRef.current !== userId || writeRevision.current !== revision) return;
      if (rows.length) {
        const { error } = await supabase.from("cart_items").upsert(rows, { onConflict: "user_id,product_id" });
        if (error) {
          if (writeRevision.current === revision) setSyncStatus("unavailable");
          return;
        }
      }

      let deletion = supabase.from("cart_items").delete().eq("user_id", userId);
      if (productIds.length) deletion = deletion.not("product_id", "in", `(${productIds.join(",")})`);
      const { error } = await deletion;
      if (userIdRef.current === userId && writeRevision.current === revision) {
        if (error) {
          setSyncStatus("unavailable");
        } else {
          writeCartStorage(STORAGE_SYNCED_USER_KEY, userId);
          setSyncStatus("synced");
        }
      }
    });
  }, [items, ready, signedInUserId, supabase]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    ready,
    syncStatus,
    addItem(product) {
      if (!ready || syncStatus === "syncing" || !product.inStock) return;
      setItems((current) => {
        const existing = current.find((line) => line.product.slug === product.slug);
        const limit = Math.min(MAX_QUANTITY, product.quantityAvailable ?? MAX_QUANTITY);
        if (existing && existing.quantity >= limit) return current;
        if (existing) return current.map((line) => line.product.slug === product.slug
          ? { ...line, quantity: Math.min(limit, line.quantity + 1) }
          : line);
        return [...current, { product, quantity: 1 }];
      });
    },
    setQuantity(slug, quantity) {
      if (!ready || syncStatus === "syncing" || !Number.isFinite(quantity)) return;
      const nextQuantity = Math.min(MAX_QUANTITY, Math.floor(quantity));
      setItems((current) => nextQuantity < 1
        ? current.filter((line) => line.product.slug !== slug)
        : current.map((line) => line.product.slug === slug
          ? { ...line, quantity: Math.min(nextQuantity, line.product.quantityAvailable ?? MAX_QUANTITY) }
          : line));
    },
    removeItem(slug) {
      if (!ready || syncStatus === "syncing") return;
      setItems((current) => current.filter((line) => line.product.slug !== slug));
    },
  }), [items, ready, syncStatus]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
