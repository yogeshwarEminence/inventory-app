import React, { useEffect, useState } from "react";
import { Api } from "../api.js";
import { useToast } from "../components/Toast.jsx";
import Modal from "../components/Modal.jsx";
import Pagination from "../components/Pagination.jsx";
import { fmtCurrency, fmtDate } from "../utils.js";
import { SkeletonRows, ErrorRow, EmptyRow } from "../components/StateViews.jsx";

const NEXT_STATUS = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["completed"],
  completed: [],
  cancelled: [],
};

export default function Orders() {
  const showToast = useToast();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState({ items: [], page: 1, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailError, setDetailError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);

  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [allCustomers, setAllCustomers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [newOrderLoading, setNewOrderLoading] = useState(false);
  const [newOrderLoadError, setNewOrderLoadError] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [itemRows, setItemRows] = useState([{ id: 0, productId: "", qty: 1 }]);
  const [rowCounter, setRowCounter] = useState(1);
  const [orderFormError, setOrderFormError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, page_size: 10 });
      if (status) params.set("status", status);
      const res = await Api.get(`/api/orders?${params.toString()}`);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  async function openDetail(orderId) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setDetailOrder(null);
    try {
      const order = await Api.get(`/api/orders/${orderId}`);
      setDetailOrder(order);
    } catch (err) {
      setDetailError(err.message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function transitionStatus(orderId, newStatus) {
    try {
      await Api.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      showToast(`Order #${orderId} marked as ${newStatus}`, "success");
      setDetailOpen(false);
      load();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function openNewOrderForm() {
    setNewOrderOpen(true);
    setNewOrderLoading(true);
    setNewOrderLoadError("");
    setOrderFormError("");
    setCustomerId("");
    setItemRows([{ id: 0, productId: "", qty: 1 }]);
    setRowCounter(1);
    try {
      const [customersRes, productsRes] = await Promise.all([
        Api.get("/api/customers?page_size=100"),
        Api.get("/api/products?page_size=100"),
      ]);
      setAllCustomers(customersRes.items);
      setAllProducts(productsRes.items.filter((p) => p.quantity_in_stock > 0));
    } catch (err) {
      setNewOrderLoadError(err.message);
    } finally {
      setNewOrderLoading(false);
    }
  }

  function addItemRow() {
    setItemRows((rows) => [...rows, { id: rowCounter, productId: "", qty: 1 }]);
    setRowCounter((c) => c + 1);
  }

  function removeItemRow(id) {
    setItemRows((rows) => rows.filter((r) => r.id !== id));
  }

  function updateRow(id, patch) {
    setItemRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function computeTotal() {
    let total = 0;
    for (const row of itemRows) {
      const product = allProducts.find((p) => String(p.id) === String(row.productId));
      if (product) total += Number(product.unit_price) * (Number(row.qty) || 0);
    }
    return total;
  }

  async function submitNewOrder(e) {
    e.preventDefault();
    setOrderFormError("");
    const items = itemRows
      .filter((r) => r.productId && Number(r.qty) > 0)
      .map((r) => ({ product_id: parseInt(r.productId, 10), quantity: parseInt(r.qty, 10) }));

    if (!customerId) {
      setOrderFormError("Please select a customer");
      return;
    }
    if (items.length === 0) {
      setOrderFormError("Add at least one item");
      return;
    }

    try {
      const order = await Api.post("/api/orders", { customer_id: parseInt(customerId, 10), items });
      showToast(`Order #${order.id} created`, "success");
      setNewOrderOpen(false);
      load();
    } catch (err) {
      setOrderFormError(err.message);
    }
  }

  return (
    <section className="page">
      <div className="toolbar">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="btn btn-primary" onClick={openNewOrderForm}>
          + New Order
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows columns={6} />}
            {!loading && error && (
              <ErrorRow columns={6} message={`Failed to load orders: ${error}`} onRetry={load} />
            )}
            {!loading && !error && result.items.length === 0 && (
              <EmptyRow
                columns={6}
                message="No orders found."
                action={
                  <button className="btn btn-primary btn-sm" onClick={openNewOrderForm}>
                    + New Order
                  </button>
                }
              />
            )}
            {!loading &&
              !error &&
              result.items.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>{o.customer_name}</td>
                  <td>
                    <span className={`badge badge-${o.status}`}>{o.status}</span>
                  </td>
                  <td>{fmtCurrency(o.total_amount)}</td>
                  <td>{fmtDate(o.order_date)}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openDetail(o.id)}>
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Pagination page={result.page} totalPages={result.total_pages} onPageClick={setPage} />

      {/* Order detail modal */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)}>
        {detailLoading && (
          <>
            <h3>Order Detail</h3>
            <p className="muted">Loading…</p>
          </>
        )}
        {!detailLoading && detailError && (
          <>
            <h3>Order Detail</h3>
            <p className="error-msg">{detailError}</p>
          </>
        )}
        {!detailLoading && !detailError && detailOrder && (
          <>
            <h3>Order #{detailOrder.id}</h3>
            <p className="muted">
              {detailOrder.customer_name} · <span className={`badge badge-${detailOrder.status}`}>{detailOrder.status}</span> ·{" "}
              {fmtDate(detailOrder.order_date)}
            </p>
            <table style={{ width: "100%", marginTop: "10px" }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detailOrder.items.map((i, idx) => (
                  <tr key={idx}>
                    <td>{i.product_name}</td>
                    <td>{i.quantity}</td>
                    <td>{fmtCurrency(i.unit_price)}</td>
                    <td>{fmtCurrency(i.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ textAlign: "right", fontWeight: 700, marginTop: "10px" }}>
              Total: {fmtCurrency(detailOrder.total_amount)}
            </p>
            <div className="modal-actions" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
              <div>
                {(NEXT_STATUS[detailOrder.status] || []).length === 0 && (
                  <span className="muted">No further actions available.</span>
                )}
                {(NEXT_STATUS[detailOrder.status] || []).map((s) => (
                  <button
                    key={s}
                    className="btn btn-secondary btn-sm"
                    onClick={() => transitionStatus(detailOrder.id, s)}
                    style={{ marginRight: "6px" }}
                  >
                    Mark as {s}
                  </button>
                ))}
              </div>
              <button className="btn btn-secondary" onClick={() => setDetailOpen(false)}>
                Close
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* New order modal */}
      <Modal open={newOrderOpen} onClose={() => setNewOrderOpen(false)}>
        <h3>New Order</h3>
        {newOrderLoading && <p className="muted">Loading form…</p>}
        {!newOrderLoading && newOrderLoadError && <p className="error-msg">{newOrderLoadError}</p>}
        {!newOrderLoading && !newOrderLoadError && (
          <form className="form-grid" onSubmit={submitNewOrder}>
            <label>Customer</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">Select customer…</option>
              {allCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>

            <label>Items</label>
            <div id="order-items-container">
              {itemRows.map((row) => (
                <div className="order-item-row" key={row.id}>
                  <select
                    className="oi-product"
                    value={row.productId}
                    onChange={(e) => updateRow(row.id, { productId: e.target.value })}
                  >
                    <option value="">Select product…</option>
                    {allProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.quantity_in_stock} in stock) — {fmtCurrency(p.unit_price)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="oi-qty"
                    min="1"
                    value={row.qty}
                    onChange={(e) => updateRow(row.id, { qty: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm oi-remove"
                    onClick={() => removeItemRow(row.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addItemRow}>
              + Add Item
            </button>

            <p style={{ textAlign: "right", fontWeight: 700 }}>Total: {fmtCurrency(computeTotal())}</p>
            <p className="error-msg">{orderFormError}</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setNewOrderOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Place Order
              </button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
}
