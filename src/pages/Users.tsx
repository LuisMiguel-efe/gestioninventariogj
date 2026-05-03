import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const Users: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({
    id: '', nombre: '', email: '', rol: 'empleado', departamento: '', activo: true
  });

  const fetchUsers = async () => {
    setUsers(await api.getUsers());
  };

  useEffect(() => { fetchUsers() }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      await api.updateUser(formData.id, formData);
    } else {
      await api.addUser(formData);
    }
    setShowForm(false);
    setIsEditing(false);
    setFormData({ id: '', nombre: '', email: '', rol: 'empleado', departamento: '', activo: true });
    fetchUsers();
  };

  const deleteUser = async (id: number) => {
    if (confirm('¿Eliminar usuario?')) {
      await api.deleteUser(id);
      fetchUsers();
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.875rem' }}>Gestión de Empleados</h1>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setIsEditing(false); setFormData({ id: '', nombre: '', email: '', rol: 'empleado', departamento: '', activo: true }); }}>
          <Plus size={18} /> Nuevo Empleado
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--surface-solid)', padding: '24px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ marginBottom: '16px' }}>{isEditing ? 'Editar' : 'Crear'} Empleado</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Identificación (Cédula)</label>
              <input required className="input-field" value={formData.id || ''} onChange={e => setFormData({ ...formData, id: e.target.value })} disabled={isEditing} placeholder="Ej: 1234567890" />
            </div>
            <div className="input-group">
              <label className="input-label">Nombre Completo</label>
              <input required className="input-field" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input type="email" required className="input-field" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">Departamento</label>
              <input required className="input-field" value={formData.departamento} onChange={e => setFormData({ ...formData, departamento: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">Rol</label>
              <select className="input-field" value={formData.rol} onChange={e => setFormData({ ...formData, rol: e.target.value })}>
                <option value="empleado">Empleado</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
               <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>Guardar</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Cédula</th>
              <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Nombre</th>
              <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Email</th>
              <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Departamento</th>
              <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Rol</th>
              <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px', fontWeight: 500 }}>{user.id}</td>
                <td style={{ padding: '12px', fontWeight: 500 }}>{user.nombre}</td>
                <td style={{ padding: '12px' }}>{user.email}</td>
                <td style={{ padding: '12px' }}>{user.departamento}</td>
                <td style={{ padding: '12px' }}>
                  <span className="badge" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>{user.rol}</span>
                </td>
                <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                  <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => { setFormData(user); setIsEditing(true); setShowForm(true); }}>
                    <Edit2 size={16} />
                  </button>
                  <button className="btn btn-outline" style={{ padding: '6px', color: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => deleteUser(user.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay empleados registrados.</p>}
      </div>
    </div>
  );
}

export default Users;
