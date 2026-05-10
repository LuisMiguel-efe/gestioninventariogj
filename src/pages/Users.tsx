import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { Plus, Edit2, Trash2, Search, ChevronDown, ChevronUp, Laptop, X, Save } from 'lucide-react';

const EMPTY_FORM = { id: '', nombre: '', email: '', rol: 'empleado', departamentoId: '', cargo: '', activo: true };

const Users: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(EMPTY_FORM);
  const [filterText, setFilterText] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    const [u, d] = await Promise.all([api.getUsers(), api.getDepartamentos()]);
    setUsers(u); setDepartamentos(d);
  };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing) {
        await api.updateUser(formData.id, formData);
      } else {
        await api.addUser(formData);
      }
      setShowForm(false);
      setIsEditing(false);
      setFormData(EMPTY_FORM);
      fetchData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally { setSubmitting(false); }
  };

  const handleEdit = (user: any) => {
    setFormData({ ...EMPTY_FORM, ...user, departamentoId: user.departamentoId ? String(user.departamentoId) : '' });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este empleado? Se perderá el vínculo con sus activos.')) {
      await api.deleteUser(id);
      fetchData();
    }
  };

  const filtered = useMemo(() => users.filter(u => {
    const text = filterText.toLowerCase();
    return !filterText ||
      u.id.toLowerCase().includes(text) ||
      u.nombre.toLowerCase().includes(text) ||
      u.email?.toLowerCase().includes(text) ||
      u.departamento?.nombre?.toLowerCase().includes(text);
  }), [users, filterText]);

  const set = (field: string, value: any) => setFormData((p: any) => ({ ...p, [field]: value }));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Gestión de Empleados</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            {users.length} empleados registrados · {users.filter(u => u.activo).length} activos
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setFormData(EMPTY_FORM); setIsEditing(false); setShowForm(s => !s); }}>
          {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Nuevo Empleado</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="form-panel">
          <h2>{isEditing ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="input-group">
                <label className="input-label">Cédula *</label>
                <input required className="input-field" value={formData.id} onChange={e => set('id', e.target.value)}
                  disabled={isEditing} placeholder="Ej: 1234567890" />
              </div>
              <div className="input-group">
                <label className="input-label">Nombre Completo *</label>
                <input required className="input-field" value={formData.nombre} onChange={e => set('nombre', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input type="email" className="input-field" value={formData.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Cargo</label>
                <input className="input-field" value={formData.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Ej: Analista de Calidad" />
              </div>
              <div className="input-group">
                <label className="input-label">Área / Departamento *</label>
                <select required className="input-field" value={formData.departamentoId} onChange={e => set('departamentoId', e.target.value)}>
                  <option value="">Seleccionar área...</option>
                  {departamentos.map((d: any) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Rol</label>
                <select className="input-field" value={formData.rol} onChange={e => set('rol', e.target.value)}>
                  <option value="empleado">Empleado</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Save size={16} /> {submitting ? 'Guardando...' : 'Guardar Empleado'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setIsEditing(false); setFormData(EMPTY_FORM); }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="input-field" placeholder="Buscar por cédula, nombre, email, área..." style={{ paddingLeft: 34 }} value={filterText} onChange={e => setFilterText(e.target.value)} />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', alignSelf: 'center' }}>
          {filtered.length} de {users.length} empleados
        </p>
      </div>

      {/* Table */}
      <div className="section-card" style={{ overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Cédula</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Cargo</th>
              <th>Área</th>
              <th>Rol</th>
              <th>Equipos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={8}><div className="empty-state"><p>No se encontraron empleados.</p></div></td></tr>
              : filtered.map(user => (
                <React.Fragment key={user.id}>
                  <tr>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem' }}>{user.id}</td>
                    <td style={{ fontWeight: 600 }}>{user.nombre}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.email || '—'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{user.cargo || '—'}</td>
                    <td>
                      {user.departamento
                        ? <span className="badge badge-asignado">{user.departamento.nombre}</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>}
                    </td>
                    <td><span className={`badge badge-${user.rol}`}>{user.rol}</span></td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                        style={{ gap: 6 }}
                      >
                        <Laptop size={14} />
                        <span>{user.ownedAssets?.length || 0} equipos</span>
                        {expandedUser === user.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-icon btn-sm" onClick={() => handleEdit(user)} title="Editar">
                          <Edit2 size={15} />
                        </button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(user.id)} title="Eliminar">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded assets */}
                  {expandedUser === user.id && (
                    <tr>
                      <td colSpan={8} style={{ padding: '12px 20px', background: 'rgba(0,82,165,0.02)' }}>
                        {!user.ownedAssets || user.ownedAssets.length === 0
                          ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Este empleado no tiene equipos asignados.</p>
                          : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                              {user.ownedAssets.map((asset: any) => (
                                <div key={asset.id} style={{
                                  background: 'white',
                                  border: '1px solid #e4ecf5',
                                  borderRadius: 8,
                                  padding: '8px 14px',
                                  fontSize: '0.82rem',
                                }}>
                                  <div style={{ fontWeight: 600, color: 'var(--primary-dark)', textTransform: 'capitalize' }}>
                                    {asset.identificador || asset.codigo}
                                  </div>
                                  <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
                                    {asset.tipo}
                                  </div>
                                  <div style={{ marginTop: 4 }}>
                                    <span className={`badge ${asset.disponibilidad === 'asignado' ? 'badge-asignado' : 'badge-prestado'}`}>
                                      {asset.disponibilidad}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        }
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
