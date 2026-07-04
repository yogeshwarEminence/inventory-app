import React, { useEffect, useState } from "react";
import { Api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import Modal from "../components/Modal.jsx";
import Pagination from "../components/Pagination.jsx";
import { debounce } from "../utils.js";
import { SkeletonRows, ErrorRow, EmptyRow } from "../components/StateViews.jsx";
import { IconSearch, IconPlus } from "../components/Icons.jsx";

const emptyForm = { full_name: "", email: "", phone: "", address: "" };

export default function Customers() {
  const { isAdmin } = useAuth();
  const showToast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState({ items: [], page: 1, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, page_size: 10 });
      if (search) params.set("search", search);
      const res = await Api.get(`/api/customers?${params.toString()}`);
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
  }, [page, search]);

  const debouncedSetSearch = React.useMemo(
    () =>
      debounce((value) => {
        setPage(1);
        setSearch(value);
      }, 350),
    []
  );

  function openForm(customer = null) {
    setEditing(customer);
    setForm(
      customer
        ? {
            full_name: customer.full_name,
            email: customer.email || "",
            phone: customer.phone || "",
            address: customer.address || "",
          }
        : emptyForm
    );
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    };
    try {
      if (editing) {
        await Api.put(`/api/customers/${editing.id}`, payload);
        showToast("Customer updated", "success");
      } else {
        await Api.post("/api/customers", payload);
        showToast("Customer created", "success");
      }
      closeForm();
      load();
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function confirmDelete() {
    try {
      await Api.del(`/api/customers/${deleteTarget.id}`);
      showToast("Customer deleted", "success");
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
            placeholder="Search customers..."
            onChange={(e) => debouncedSetSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => openForm()}>
          <IconPlus width={15} height={15} /> New Customer
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows columns={5} />}
            {!loading && error && (
              <ErrorRow columns={5} message={`Failed to load customers: ${error}`} onRetry={load} />
            )}
            {!loading && !error && result.items.length === 0 && (
              <EmptyRow
                columns={5}
                message="No customers found."
                action={
                  <button className="btn btn-primary btn-sm" onClick={() => openForm()}>
                    <IconPlus width={13} height={13} /> Add Customer
                  </button>
                }
              />
            )}
            {!loading &&
              !error &&
              result.items.map((c) => (
                <tr key={c.id}>
                  <td>{c.full_name}</td>
                  <td>{c.email || "—"}</td>
                  <td>{c.phone || "—"}</td>
                  <td>{c.address || "—"}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openForm(c)}>
                        Edit
                      </button>
                      {isAdmin && (
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(c)}>
                          Delete
                        </button>
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
        <h3>{editing ? "Edit Customer" : "New Customer"}</h3>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            type="text"
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <label>Phone</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <label>Address</label>
          <textarea
            rows="2"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <p className="error-msg">{formError}</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={closeForm}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editing ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <h3>Delete Customer?</h3>
        <p className="muted">This cannot be undone.</p>
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
