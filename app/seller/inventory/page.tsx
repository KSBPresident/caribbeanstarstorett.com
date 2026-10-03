import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import { createInventoryItem, updateInventoryItem } from "./actions";
import { createClient } from "../../../lib/supabase/server";
import { isSupabaseConfigured } from "../../../lib/supabase/configured";
import { categories, money } from "../../../lib/store-data";
import { signInUrl } from "../../../lib/auth/return-path";
import { ProductCategoryField } from "../../../components/product-category-field";

export const metadata: Metadata = {
  title: "Seller inventory",
  description: "Create and manage product listings in your approved Caribbean Star Store workspace.",
  robots: { index: false, follow: false },
};

type PageProps = { searchParams: Promise<{ error?: string; notice?: string }> };

export default async function SellerInventoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(signInUrl("/seller/inventory"));

  const { data: applications, error: applicationsError } = await supabase
    .from("seller_applications")
    .select("organization_id")
    .eq("applicant_user_id", user.id)
    .eq("status", "approved")
    .not("organization_id", "is", null);
  const organizationIds = [...new Set((applications || []).map((row) => row.organization_id).filter((id): id is string => Boolean(id)))];
  const { data: memberships, error: membershipsError } = organizationIds.length
    ? await supabase.from("organization_members")
        .select("organization_id, role_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .in("organization_id", organizationIds)
    : { data: [], error: null };
  const activeIds = [...new Set((memberships || []).map((row) => row.organization_id))];
  const [{ data: organizations, error: organizationsError }, { data: roles, error: rolesError }] = await Promise.all([
    activeIds.length
      ? supabase.from("organizations").select("id, name").in("id", activeIds)
      : Promise.resolve({ data: [], error: null }),
    memberships?.length
      ? supabase.from("roles").select("id, name").in("id", [...new Set(memberships.map((row) => row.role_id))])
      : Promise.resolve({ data: [], error: null }),
  ]);
  const roleIds = memberships?.length ? [...new Set(memberships.map((row) => row.role_id))] : [];
  const { data: roleLinks, error: roleLinksError } = roleIds.length
    ? await supabase.from("role_permissions").select("role_id, permission_id").in("role_id", roleIds)
    : { data: [], error: null };
  const permissionIds = [...new Set((roleLinks || []).map((row) => row.permission_id))];
  const { data: permissions, error: permissionsError } = permissionIds.length
    ? await supabase.from("permissions").select("id, key").in("id", permissionIds)
    : { data: [], error: null };
  const permissionById = new Map((permissions || []).map((row) => [row.id, row.key]));
  const manageableOrganizations = new Set((memberships || [])
    .filter((membership) => (roleLinks || []).some((link) =>
      link.role_id === membership.role_id && permissionById.get(link.permission_id) === "organization.manage"))
    .map((membership) => membership.organization_id));
  const safeToShowManagement = !applicationsError && !membershipsError && !organizationsError && !rolesError && !roleLinksError && !permissionsError;
  const visibleOrganizations = (organizations || []).map((organization) => ({
    ...organization,
    canManage: safeToShowManagement && manageableOrganizations.has(organization.id),
  }));
  const { data: items, error: itemsError } = activeIds.length
    ? await supabase.from("inventory_items")
        .select("id, organization_id, slug, name, category_key, description, price, currency, quantity_available, image_url, status, created_at, updated_at")
        .in("organization_id", activeIds)
        .order("updated_at", { ascending: false })
        .limit(100)
    : { data: [], error: null };

  const notice = params.notice === "created" ? "Product draft or listing saved."
    : params.notice === "updated" ? "Product listing updated."
    : null;
  const errorMessage = params.error === "invalid" ? "Check the product details, image address, and inventory quantity."
    : params.error === "save" ? "We couldn’t save the product. Confirm that you have management access to an approved seller workspace."
    : null;

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page directory-page">
        <p className="workspace-back"><Link href="/seller">← Seller workspaces</Link></p>
        <header className="directory-hero">
          <span className="identity-eyebrow">STORE OWNER SPACE · PRODUCT INVENTORY</span>
          <h1>Manage your product listings.</h1>
          <p>Create a draft for review or publish a product to the marketplace from an approved seller workspace.</p>
        </header>
        {notice && <p className="identity-message" role="status">{notice}</p>}
        {errorMessage && <p className="identity-message identity-error" role="alert">{errorMessage}</p>}
        {!safeToShowManagement && <p className="identity-message identity-error" role="alert">We couldn’t verify seller permissions. Refresh the page to try again.</p>}
        {applicationsError || membershipsError || organizationsError ? (
          <p className="identity-message identity-error" role="alert">We couldn’t load your approved store workspaces.</p>
        ) : !visibleOrganizations.length ? (
          <section className="identity-panel">
            <h2>No approved seller workspace</h2>
            <p>Product inventory opens after your seller application has been approved and workspace access is active.</p>
            <Link className="identity-submit" href="/sell">View seller application</Link>
          </section>
        ) : (
          <div className="seller-layout">
            <section className="identity-panel">
              <span className="identity-eyebrow">INVENTORY</span>
              <h2>Your product listings</h2>
              {itemsError ? (
                <p className="identity-message identity-error" role="alert">Your product inventory could not be loaded.</p>
              ) : items?.length ? (
                <div className="seller-app-list">
                  {items.map((item) => {
                    const organization = visibleOrganizations.find((value) => value.id === item.organization_id);
                    const category = categories.find((value) => value.key === item.category_key)?.name || "Marketplace";
                    return (
                      <article className="seller-app-card" key={item.id}>
                        <div className="seller-app-heading"><strong>{item.name}</strong><span className={item.status === "published" ? "seller-status seller-status-approved" : "seller-status"}>{item.status}</span></div>
                        <p>{organization?.name || "Store"} · {category} · {money(Number(item.price), item.currency)}</p>
                        {organization?.canManage ? <form action={updateInventoryItem} className="identity-form seller-form">
                          <input type="hidden" name="itemId" value={item.id} />
                          <input type="hidden" name="organizationId" value={item.organization_id} />
                          <label>Product name<input name="name" defaultValue={item.name} minLength={2} maxLength={140} required /></label>
                          <ProductCategoryField defaultValue={item.category_key} />
                          <label>Description<textarea name="description" defaultValue={item.description} placeholder="Describe the item, condition, what is included, and the details prompted above." minLength={30} maxLength={3000} rows={3} required /></label>
                          <div className="seller-form-row">
                            <label>Price (USD)<input name="price" type="number" min="0.01" max="9999999999" step="0.01" defaultValue={item.price} required /></label>
                            <label>Quantity available<input name="quantity" type="number" min="0" max="1000000" step="1" defaultValue={item.quantity_available} required /></label>
                          </div>
                          <label>Product image URL<input name="imageUrl" type="url" defaultValue={item.image_url} maxLength={2048} required /><small>Use an HTTPS image address. Product image uploads are not connected yet.</small></label>
                          <label>Listing status<select name="status" defaultValue={item.status}><option value="draft">Save as draft</option><option value="published">Publish listing</option><option value="archived">Archive listing</option></select></label>
                          <button className="identity-submit" type="submit">Save product listing</button>
                        </form> : <p>Your assigned workspace role allows you to view this product, but not change it.</p>}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="directory-empty"><h3>No products in inventory yet</h3><p>Add accurate product details and your own image to create your first listing.</p></div>
              )}
            </section>
            <aside className="identity-panel">
              <span className="identity-eyebrow">NEW PRODUCT</span>
              <h2>Add inventory</h2>
              {safeToShowManagement && visibleOrganizations.some((organization) => organization.canManage) ? (
                <form action={createInventoryItem} className="identity-form seller-form">
                  <label>Store<select name="organizationId" required>{visibleOrganizations.filter((organization) => organization.canManage).map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label>
                  <label>Product name<input name="name" minLength={2} maxLength={140} required /></label>
                  <ProductCategoryField defaultValue={categories[0].key} />
                  <label>Description<textarea name="description" placeholder="Describe the item, condition, what is included, and the details prompted above." minLength={30} maxLength={3000} rows={5} required /></label>
                  <div className="seller-form-row">
                    <label>Price (USD)<input name="price" type="number" min="0.01" max="9999999999" step="0.01" required /></label>
                    <label>Quantity available<input name="quantity" type="number" min="0" max="1000000" step="1" defaultValue="0" required /></label>
                  </div>
                  <label>Product image URL<input name="imageUrl" type="url" placeholder="https://…" maxLength={2048} required /><small>Use an HTTPS image address. Image upload storage will be added with the media service.</small></label>
                  <label>Listing status<select name="status" defaultValue="draft"><option value="draft">Save as draft</option><option value="published">Publish listing</option></select></label>
                  <button className="identity-submit" type="submit">Save product listing</button>
                </form>
              ) : (
                <p>Your role allows you to view this inventory. Ask a store owner or administrator to add or update products.</p>
              )}
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
