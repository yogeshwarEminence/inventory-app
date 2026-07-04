import React, { useEffect, useState } from "react";
import { Api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import Modal from "../components/Modal.jsx";
import { SkeletonRows, ErrorRow, EmptyRow } from "../components/StateViews.jsx";
import { IconPlus } from "../components/Icons.jsx";

export default function Categories() {
  const { isAdmin } = useAuth();
  const showToast = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // category object or null
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const result = await Api.get("/api/categories");
      setItems(result.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openForm(category = null) {
    setEditing(category);
    setName(category ? category.name : "");
    setDescription(category ? category.description || "" : "");
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { name: name.trim(), description: description.trim() };
    try {
      if (editing) {
        await Api.put(`/api/categories/${editing.id}`, payload);
        showToast("Category updated", "success");
      } else {
        await Api.post("/api/categories", payload);
        showToast("Category created", "success");
      }
      closeForm();
      load();
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function confirmDelete() {
    try {
      await Api.del(`/api/categories/${deleteTarget.id}`);
      showToast("Category deleted", "success");
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  return (
    <section className="page">
      <div className="toolbar">
        <h3>Categories</h3>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => openForm()}>
            <IconPlus width={15} height={15} /> New Category
          </button>
        )}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows columns={3} />}
            {!loading && error && (
              <ErrorRow columns={3} message={`Failed to load categories: ${error}`} onRetry={load} />
            )}
            {!loading && !error && items.length === 0 && (
              <EmptyRow
                columns={3}
                message="No categories yet."
                action={
                  isAdmin && (
                    <button className="btn btn-primary btn-sm" onClick={() => openForm()}>
                      <IconPlus width={13} height={13} /> Add Category
                    </button>
                  )
                }
              />
            )}
            {!loading &&
              !error &&
              items.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.description || "—"}</td>
                  {isAdmin && (
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openForm(c)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(c)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal open={formOpen} onClose={closeForm}>
        <h3>{editing ? "Edit Category" : "New Category"}</h3>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>Name</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
          <label>Description</label>
          <textarea rows="2" value={description} onChange={(e) => setDescription(e.target.value)} />
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
        <h3>Delete Category?</h3>
        <p className="muted">Products in this category will become uncategorized.</p>
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
