import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { Plus, Edit2, Trash2, Search, ChevronDown, ChevronUp, X, Save, Wrench } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIAS = ['manual', 'electrica', 'medicion', 'seguridad', 'equipo_pesado', 'otro'];
const CONDICIONES = ['bueno', 'regular', 'dañado'];

const CATEGORIA_LABEL: Record<string, string> = {
  manual: 'Manual',
  electrica: 'Eléctrica',
  medicion: 'Medición',
  seguridad: 'Seguridad',
  equipo_pesado: 'Equipo pesado',
  otro: 'Otro',
};

const BADGE_DISPO: Record<string, string> = {
  disponible: 'badge-disponible',
  asignado: 'badge-asignado',
  prestado: 'badge-prestado',
  'en reparacion': 'badge-enreparacion',
  'no disponible': 'badge-baja',
};

const BADGE_ESTADO: Record<string, string> = {
  activo: 'badge-activo',
  inactivo: 'badge-cambio',
  baja: 'badge-inactivo',
};

const EMPTY_FORM = {
  codigo: '', identificador: '', nombre: '', categoria: 'manual', marca: '', modelo: '',
  condicion: 'bueno', estado: 'activo', disponibilidad: 'disponible', cantidad: '1',
  ubicacion: '', departamentoId: '', propietarioId: '', fechaAdquisicion: '',
  valorAdquisicion: '', notas: '', detallesAdicionales: '',
};

const Herramientas: React.FC = () => {
  const { sessionUser } = useAuth();
  const navigate = useNavigate();
  const isAdmin = sessionUser?.rol === 'administrador';

  const [herramientas, setHerramientas] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);

  const [filterText, setFilterText] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterDispo, setFilterDispo] = useState('');
  const [filterDepartamento, setFilterDepartamento] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    const [h, u, d] = await Promise.all([
      api.getHerramientas(), api.getUsers(), api.getDepartamentos(),
    ]);
    setHerramientas(h); setUsers(u); setDepartamentos(d);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing) {
        await api.updateHerramienta(formData.id, formData);
      } else {
        await api.addHerramienta(formData);
      }
      setShowForm(false);
      setIsEditing(false);
      setFormData(EMPTY_FORM);
      fetchData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (h: any) => {
    const flat = {
      ...EMPTY_FORM,
      ...h,
      departamentoId: h.departamentoId ? String(h.departamentoId) : '',
      propietarioId: h.propietarioId || '',
      fechaAdquisicion: h.fechaAdquisicion ? h.fechaAdquisicion.split('T')[0] : '',
      valorAdquisicion: h.valorAdquisicion ? String(h.valorAdquisicion) : '',
      cantidad: h.cantidad ? String(h.cantidad) : '1',
    };
    setFormData(flat);
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar esta herramienta? Esta acción no se puede deshacer.')) {
      await api.deleteHerramienta(id);
      fetchData();
    }
  };

  const filtered = useMemo(() => herramientas.filter(h => {
    const text = filterText.toLowerCase();
    const matchText = !filterText ||
      h.codigo?.toLowerCase().includes(text) ||
      h.identificador?.toLowerCase().includes(text) ||
      h.nombre?.toLowerCase().includes(text) ||
      h.marca?.toLowerCase().includes(text) ||
      h.modelo?.toLowerCase().includes(text);
    const matchCategoria = !filterCategoria || h.categoria === filterCategoria;
    const matchDispo = !filterDispo || h.disponibilidad === filterDispo;
    const matchDepartamento = !filterDepartamento || String(h.departamentoId) === filterDepartamento;
    return matchText && matchCategoria && matchDispo && matchDepartamento;
  }), [herramientas, filterText, filterCategoria, filterDispo, filterDepartamento]);

  const set = (field: string, value: any) => setFormData((p: any) => ({ ...p, [field]: value }));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }} onClick={() => navigate('/assets')}>
            ← Volver a Activos
            </button>
          <h1>Herramientas de Construcción</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            {herramientas.length} herramientas registradas · {herramientas.filter(h => h.disponibilidad === 'disponible').length} disponibles
            {!isAdmin && <span style={{ marginLeft: 12, color: '#f59e0b', fontWeight: 600 }}>📖 Solo lectura</span>}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setFormData(EMPTY_FORM); setIsEditing(false); setShowForm(s => !s); }}>
            {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Nueva Herramienta</>}
          </button>
        )}
      </div>

      {/* Form */}
      {isAdmin && showForm && (
        <div className="form-panel">
          <h2>{isEditing ? 'Editar Herramienta' : 'Registrar Nueva Herramienta'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="input-group">
                <label className="input-label">Código / Serial *</label>
                <input required className="input-field" value={formData.codigo} onChange={e => set('codigo', e.target.value)} placeholder="Ej: HRM-2026-001" />
              </div>
              <div className="input-group">
                <label className="input-label">Identificador amigable</label>
                <input className="input-field" value={formData.identificador} onChange={e => set('identificador', e.target.value)} placeholder="Ej: taladro01" />
              </div>
              <div className="input-group">
                <label className="input-label">Nombre *</label>
                <input required className="input-field" value={formData.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Taladro percutor" />
              </div>
              <div className="input-group">
                <label className="input-label">Categoría *</label>
                <select required className="input-field" value={formData.categoria} onChange={e => set('categoria', e.target.value)}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Marca *</label>
                <input required className="input-field" value={formData.marca} onChange={e => set('marca', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Modelo *</label>
                <input required className="input-field" value={formData.modelo} onChange={e => set('modelo', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Cantidad</label>
                <input type="number" min={1} className="input-field" value={formData.cantidad} onChange={e => set('cantidad', e.target.value)} placeholder="1" />
              </div>
              <div className="input-group">
                <label className="input-label">Condición</label>
                <select className="input-field" value={formData.condicion} onChange={e => set('condicion', e.target.value)}>
                  {CONDICIONES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Estado</label>
                <select className="input-field" value={formData.estado} onChange={e => set('estado', e.target.value)}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="baja">Dado de Baja</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Disponibilidad</label>
                <select className="input-field" value={formData.disponibilidad} onChange={e => set('disponibilidad', e.target.value)}>
                  <option value="disponible">Disponible</option>
                  <option value="asignado">Asignado</option>
                  <option value="prestado">En Préstamo</option>
                  <option value="en reparacion">En Reparación</option>
                  <option value="no disponible">No disponible (Dado de baja)</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Área / Ubicación *</label>
                <select required className="input-field" value={formData.departamentoId} onChange={e => {
                  const dep = departamentos.find((d: any) => String(d.id) === e.target.value);
                  set('departamentoId', e.target.value);
                  if (dep) set('ubicacion', dep.nombre);
                }}>
                  <option value="">Seleccionar área...</option>
                  {departamentos.map((d: any) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Asignado a (Empleado)</label>
                <select className="input-field" value={formData.propietarioId} onChange={e => set('propietarioId', e.target.value)}>
                  <option value="">Sin asignar</option>
                  {users.map((u: any) => <option key={u.id} value={u.id}>{u.nombre} — C.C. {u.id}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Fecha de adquisición</label>
                <input type="date" className="input-field" value={formData.fechaAdquisicion} onChange={e => set('fechaAdquisicion', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Valor adquisición (COP)</label>
                <input type="number" className="input-field" value={formData.valorAdquisicion} onChange={e => set('valorAdquisicion', e.target.value)} placeholder="0" />
              </div>
            </div>

            <div className="form-grid">
              <div className="input-group">
                <label className="input-label">Detalles adicionales</label>
                <textarea className="input-field" rows={2} value={formData.detallesAdicionales} onChange={e => set('detallesAdicionales', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Notas internas</label>
                <textarea className="input-field" rows={2} value={formData.notas} onChange={e => set('notas', e.target.value)} />
              </div>
            </div>

            <div style={{ marginTop: 8, display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Save size={16} /> {submitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Registrar Herramienta')}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setIsEditing(false); setFormData(EMPTY_FORM); }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="input-field" placeholder="Buscar por código, nombre, marca..." style={{ paddingLeft: 34 }} value={filterText} onChange={e => setFilterText(e.target.value)} />
        </div>
        <select className="input-field" style={{ maxWidth: 180 }} value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)}>
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>)}
        </select>
        <select className="input-field" style={{ maxWidth: 180 }} value={filterDispo} onChange={e => setFilterDispo(e.target.value)}>
          <option value="">Toda disponibilidad</option>
          <option value="disponible">Disponible</option>
          <option value="asignado">Asignado</option>
          <option value="prestado">En Préstamo</option>
          <option value="en reparacion">En Reparación</option>
          <option value="no disponible">No disponible</option>
        </select>
        <select className="input-field" style={{ maxWidth: 200 }} value={filterDepartamento} onChange={e => setFilterDepartamento(e.target.value)}>
          <option value="">Todas las áreas</option>
          {departamentos.map((d: any) => <option key={d.id} value={String(d.id)}>{d.nombre}</option>)}
        </select>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 12 }}>
        Mostrando {filtered.length} de {herramientas.length} herramientas
      </p>

      {/* Table */}
      <div className="section-card" style={{ overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Herramienta</th>
              <th>Categoría</th>
              <th>Serial / Código</th>
              <th>Cant.</th>
              <th>Ubicación</th>
              <th>Asignado a</th>
              <th>Estado</th>
              <th>Condición</th>
              <th>Disponibilidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={10}><div className="empty-state"><p>No se encontraron herramientas con esos filtros.</p></div></td></tr>
              : filtered.map(h => (
                <React.Fragment key={h.id}>
                  <tr>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>
                        {h.identificador || h.nombre || '—'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {h.marca} {h.modelo}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-asignado" style={{ textTransform: 'capitalize' }}>
                        {CATEGORIA_LABEL[h.categoria] || h.categoria}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{h.codigo}</td>
                    <td>{h.cantidad ?? 1}</td>
                    <td>{h.ubicacion || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>
                      {h.propietario
                        ? <div>
                          <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{h.propietario.nombre}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>C.C. {h.propietario.id}</div>
                        </div>
                        : <span style={{ color: 'var(--text-muted)' }}>Sin asignar</span>}
                    </td>
                    <td>
                      <span className={`badge ${BADGE_ESTADO[h.estado] || 'badge-cambio'}`} style={{ textTransform: 'capitalize' }}>
                        {h.estado === 'baja' ? 'Dado de baja' : h.estado}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${h.condicion === 'bueno' ? 'badge-activo' : h.condicion === 'dañado' ? 'badge-inactivo' : 'badge-cambio'}`}>
                        {h.condicion}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${BADGE_DISPO[h.disponibilidad] || 'badge-baja'}`}>
                        {h.disponibilidad}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-icon btn-sm" title="Expandir detalles" onClick={() => setExpandedRow(expandedRow === h.id ? null : h.id)}>
                          {expandedRow === h.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                        {isAdmin && (
                          <>
                            <button className="btn btn-outline btn-icon btn-sm" title="Editar" onClick={() => handleEdit(h)}>
                              <Edit2 size={15} />
                            </button>
                            <button className="btn btn-danger btn-icon btn-sm" title="Eliminar" onClick={() => handleDelete(h.id)}>
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedRow === h.id && (
                    <tr>
                      <td colSpan={10} style={{ padding: 0, background: 'rgba(0,82,165,0.02)' }}>
                        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                          <InfoItem label="Estado" value={h.estado} />
                          {h.valorAdquisicion && <InfoItem label="Valor adquisición" value={`$${Number(h.valorAdquisicion).toLocaleString('es-CO')} COP`} />}
                          {h.fechaAdquisicion && <InfoItem label="Fecha adquisición" value={new Date(h.fechaAdquisicion).toLocaleDateString('es-CO')} />}
                          {h.detallesAdicionales && <InfoItem label="Detalles adicionales" value={h.detallesAdicionales} />}
                          {h.notas && <InfoItem label="Notas" value={h.notas} />}
                        </div>
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

const InfoItem: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: '0.85rem', fontWeight: 500, fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</div>
  </div>
);

export default Herramientas;