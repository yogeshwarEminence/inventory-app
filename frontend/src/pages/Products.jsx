import React, { useEffect, useState } from "react";
import { Api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import Modal from "../components/Modal.jsx";
import Pagination from "../components/Pagination.jsx";
import { fmtCurrency, debounce } from "../utils.js";
import { SkeletonRows, ErrorRow, EmptyRow } from "../components/StateViews.jsx";
import { IconSearch, IconPlus } from "../components/Icons.jsx";

const emptyForm = {
  sku: "",
  name: "",
  description: "",
  category_id: "",
  unit_price: "",
  quantity_in_stock: "0",
  reorder_level: "10",
};

export default function Products() {
  const { isAdmin } = useAuth();
  const showToast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [result, setResult] = useState({ items: [], page: 1, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustId, setAdjustId] = useState(null);
  const [delta, setDelta] = useState("");
  const [adjustError, setAdjustError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);

  async function loadCategories() {
    try {
      const res = await Api.get("/api/categories");
      setCategories(res.items);
    } catch (e) {
      /* non-fatal */
    }
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, page_size: 10 });
      if (search) params.set("search", search);
      if (lowStockOnly) params.set("low_stock", "true");
      const res = await Api.get(`/api/products?${params.toString()}`);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, lowStockOnly]);

  const debouncedSetSearch = React.useMemo(
    () =>
      debounce((value) => {
        setPage(1);
        setSearch(value);
      }, 350),
    []
  );

  function openForm(product = null) {
    setFormError("");
    if (product) {
      setEditingId(product.id);
      Api.get(`/api/products/${product.id}`).then((p) => {
        setForm({
          sku: p.sku,
          name: p.name,
          description: p.description || "",
          category_id: p.category_id || "",
          unit_price: String(p.unit_price),
          quantity_in_stock: String(p.quantity_in_stock),
          reorder_level: String(p.reorder_level),
        });
      });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      category_id: form.category_id || null,
      unit_price: parseFloat(form.unit_price),
      quantity_in_stock: parseInt(form.quantity_in_stock || "0", 10),
      reorder_level: parseInt(form.reorder_level || "10", 10),
    };
    try {
      if (editingId) {
        await Api.put(`/api/products/${editingId}`, payload);
        showToast("Product updated", "success");
      } else {
        await Api.post("/api/products", payload);
        showToast("Product created", "success");
      }
      closeForm();
      load();
    } catch (err) {
      setFormError(err.message);
    }
  }

  function openAdjustStock(id) {
    setAdjustId(id);
    setDelta("");
    setAdjustError("");
    setAdjustOpen(true);
  }

  async function submitAdjust(e) {
    e.preventDefault();
    try {
      await Api.patch(`/api/products/${adjustId}/stock`, { delta: parseInt(delta, 10) });
      showToast("Stock updated", "success");
      setAdjustOpen(false);
      load();
    } catch (err) {
      setAdjustError(err.message);
    }
  }

  async function confirmDelete() {
    try {
      await Api.del(`/api/products/${deleteTarget.id}`);
      showToast("Product deleted", "success");
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  return (
    <section className="page">
      <div className="toolbar">
        <div className="search-field">
          <IconSearch width={15} height={15} />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            onChange={(e) => debouncedSetSearch(e.target.value)}
          />
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => {
              setLowStockOnly(e.target.checked);
              setPage(1);
            }}
          />{" "}
          Low stock only
        </label>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => openForm()}>
            <IconPlus width={15} height={15} /> New Product
          </button>
        )}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows columns={7} />}
            {!loading && error && (
              <ErrorRow columns={7} message={`Failed to load products: ${error}`} onRetry={load} />
            )}
            {!loading && !error && result.items.length === 0 && (
              <EmptyRow
                columns={7}
                message="No products found."
                action={
                  isAdmin && (
                    <button className="btn btn-primary btn-sm" onClick={() => openForm()}>
                      + Add Product
                    </button>
                  )
                }
              />
            )}
            {!loading &&
              !error &&
              result.items.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.category_name || "—"}</td>
                  <td className="mono">{fmtCurrency(p.unit_price)}</td>
                  <td className="mono">{p.quantity_in_stock}</td>
                  <td>
                    {p.low_stock ? (
                      <span className="badge badge-low">Low Stock</span>
                    ) : (
                      <span className="badge badge-active">In Stock</span>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openAdjustStock(p.id)}>
                        ± Stock
                      </button>
                      {isAdmin && (
                        <>
                          <button className="btn btn-secondary btn-sm" onClick={() => openForm(p)}>
                            Edit
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(p)}>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Pagination page={result.page} totalPages={result.total_pages} onPageClick={setPage} />

      <Modal open={formOpen} onClose={closeForm}>
        <h3>{editingId ? "Edit Product" : "New Product"}</h3>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-row">
            <div>
              <label>SKU</label>
              <input
                type="text"
                required
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </div>
            <div>
              <label>Category</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label>Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <label>Description</label>
          <textarea
            rows="2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="form-row">
            <div>
              <label>Unit Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.unit_price}
                onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
              />
            </div>
            <div>
              <label>Stock Qty</label>
              <input
                type="number"
                min="0"
                value={form.quantity_in_stock}
                onChange={(e) => setForm({ ...form, quantity_in_stock: e.target.value })}
              />
            </div>
            <div>
              <label>Reorder Level</label>
              <input
                type="number"
                min="0"
                value={form.reorder_level}
                onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
              />
            </div>
          </div>
          <p className="error-msg">{formError}</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={closeForm}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingId ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={adjustOpen} onClose={() => setAdjustOpen(false)}>
        <h3>Adjust Stock</h3>
        <form className="form-grid" onSubmit={submitAdjust}>
          <label>Quantity change (use negative to remove stock)</label>
          <input
            type="number"
            required
            placeholder="e.g. 10 or -5"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
          />
          <p className="error-msg">{adjustError}</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setAdjustOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Apply
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <h3>Delete Product?</h3>
        <p className="muted">
          This will deactivate the product. It can be re-activated later by an admin via the API.
        </p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={confirmDelete}>
            Delete
          </button>
        </div>
      </Modal>
    </section>
  );
}
