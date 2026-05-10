import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { Plus, Edit2, Trash2, Search, History, ChevronDown, ChevronUp, X, Save } from 'lucide-react';
import AssetHistory from '../components/AssetHistory';

const TIPOS = ['laptop', 'desktop', 'tablet', 'celular', 'impresora', 'pantalla', 'accesorio'];
const SUBTIPO_ACCESORIO = ['mouse', 'teclado', 'cargador', 'hub adaptador', 'auriculares', 'webcam', 'otro'];
const CONDICIONES = ['bueno', 'regular', 'dañado'];

const BADGE_DISPO: Record<string, string> = {
  disponible: 'badge-disponible',
  asignado: 'badge-asignado',
  prestado: 'badge-prestado',
  'en reparacion': 'badge-enreparacion',
};

const EMPTY_FORM = {
  codigo: '', identificador: '', tipo: 'laptop', subTipo: '', marca: '', modelo: '',
  procesador: '', condicion: 'bueno', estado: 'activo', disponibilidad: 'disponible',
  ubicacion: '', departamentoId: '', propietarioId: '', fechaAdquisicion: '',
  valorAdquisicion: '', notas: '', detallesAdicionales: '',
  // Celular
  imei: '', imei2: '', phoneLineId: '',
  // Impresora
  referenciaEquipo: '', precioToner: '', costoPromImpresion: '', tipoImpresion: '',
};

const Assets: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [phoneLines, setPhoneLines] = useState<any[]>([]);

  const [filterText, setFilterText] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterDispo, setFilterDispo] = useState('');
  const [filterCedula, setFilterCedula] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [historyAsset, setHistoryAsset] = useState<any | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    const [a, u, d, p] = await Promise.all([
      api.getAssets(), api.getUsers(), api.getDepartamentos(), api.getPhoneLines(),
    ]);
    setAssets(a); setUsers(u); setDepartamentos(d); setPhoneLines(p);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing) {
        await api.updateAsset(formData.id, formData);
      } else {
        await api.addAsset(formData);
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

  const handleEdit = (asset: any) => {
    const flat = {
      ...EMPTY_FORM,
      ...asset,
      departamentoId: asset.departamentoId ? String(asset.departamentoId) : '',
      propietarioId: asset.propietarioId || '',
      fechaAdquisicion: asset.fechaAdquisicion ? asset.fechaAdquisicion.split('T')[0] : '',
      valorAdquisicion: asset.valorAdquisicion ? String(asset.valorAdquisicion) : '',
      // Celular fields
      imei: asset.cellphoneDetail?.imei || '',
      imei2: asset.cellphoneDetail?.imei2 || '',
      phoneLineId: asset.cellphoneDetail?.phoneLineId ? String(asset.cellphoneDetail.phoneLineId) : '',
      // Printer fields
      referenciaEquipo: asset.printerDetail?.referenciaEquipo || '',
      precioToner: asset.printerDetail?.precioToner ? String(asset.printerDetail.precioToner) : '',
      costoPromImpresion: asset.printerDetail?.costoPromImpresion ? String(asset.printerDetail.costoPromImpresion) : '',
      tipoImpresion: asset.printerDetail?.tipoImpresion || '',
    };
    setFormData(flat);
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar este activo? Esta acción no se puede deshacer.')) {
      await api.deleteAsset(id);
      fetchData();
    }
  };

  const filtered = useMemo(() => assets.filter(a => {
    const text = filterText.toLowerCase();
    const matchText = !filterText ||
      a.codigo?.toLowerCase().includes(text) ||
      a.identificador?.toLowerCase().includes(text) ||
      a.marca?.toLowerCase().includes(text) ||
      a.modelo?.toLowerCase().includes(text);
    const matchTipo = !filterTipo || a.tipo === filterTipo;
    const matchDispo = !filterDispo || a.disponibilidad === filterDispo;
    const matchCedula = !filterCedula || String(a.propietarioId).includes(filterCedula);
    return matchText && matchTipo && matchDispo && matchCedula;
  }), [assets, filterText, filterTipo, filterDispo, filterCedula]);

  const set = (field: string, value: any) => setFormData((p: any) => ({ ...p, [field]: value }));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Inventario de Activos</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            {assets.length} equipos registrados · {assets.filter(a => a.disponibilidad === 'disponible').length} disponibles
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setFormData(EMPTY_FORM); setIsEditing(false); setShowForm(s => !s); }}>
          {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Nuevo Activo</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="form-panel">
          <h2>{isEditing ? 'Editar Activo' : 'Registrar Nuevo Activo'}</h2>
          <form onSubmit={handleSubmit}>
            {/* Base fields */}
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="input-group">
                <label className="input-label">Código / Serial *</label>
                <input required className="input-field" value={formData.codigo} onChange={e => set('codigo', e.target.value)} placeholder="Ej: SN-2024-001" />
              </div>
              <div className="input-group">
                <label className="input-label">Identificador amigable</label>
                <input className="input-field" value={formData.identificador} onChange={e => set('identificador', e.target.value)} placeholder="Ej: laptop53" />
              </div>
              <div className="input-group">
                <label className="input-label">Tipo *</label>
                <select required className="input-field" value={formData.tipo} onChange={e => set('tipo', e.target.value)}>
                  {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              {formData.tipo === 'accesorio' && (
                <div className="input-group">
                  <label className="input-label">Subtipo de accesorio</label>
                  <select className="input-field" value={formData.subTipo} onChange={e => set('subTipo', e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {SUBTIPO_ACCESORIO.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              )}
              <div className="input-group">
                <label className="input-label">Marca *</label>
                <input required className="input-field" value={formData.marca} onChange={e => set('marca', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Modelo *</label>
                <input required className="input-field" value={formData.modelo} onChange={e => set('modelo', e.target.value)} />
              </div>
              {['laptop', 'desktop', 'tablet'].includes(formData.tipo) && (
                <div className="input-group">
                  <label className="input-label">Procesador</label>
                  <input className="input-field" value={formData.procesador} onChange={e => set('procesador', e.target.value)} placeholder="Ej: Intel Core i7-12th" />
                </div>
              )}
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

            {/* Celular fields */}
            {formData.tipo === 'celular' && (
              <div style={{ background: 'rgba(8,145,178,0.05)', border: '1px solid rgba(8,145,178,0.15)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: 12, color: '#0891b2' }}>📱 Detalles del Celular</h3>
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label">IMEI 1</label>
                    <input className="input-field" value={formData.imei} onChange={e => set('imei', e.target.value)} placeholder="15 dígitos" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">IMEI 2 (si aplica)</label>
                    <input className="input-field" value={formData.imei2} onChange={e => set('imei2', e.target.value)} placeholder="15 dígitos" />
                  </div>
                  <div className="input-group span-2">
                    <label className="input-label">Línea Móvil Asignada</label>
                    <select className="input-field" value={formData.phoneLineId} onChange={e => set('phoneLineId', e.target.value)}>
                      <option value="">Sin línea asignada</option>
                      {phoneLines.map((l: any) => (
                        <option key={l.id} value={l.id}>
                          {l.numero} — {l.operador} {l.planNombre ? `| ${l.planNombre}` : ''} {l.precioMensual ? `| $${l.precioMensual.toLocaleString()}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Impresora fields */}
            {formData.tipo === 'impresora' && (
              <div style={{ background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.15)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: 12, color: '#059669' }}>🖨️ Detalles de Impresora</h3>
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label">Referencia de equipo</label>
                    <input className="input-field" value={formData.referenciaEquipo} onChange={e => set('referenciaEquipo', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Tipo de impresión</label>
                    <select className="input-field" value={formData.tipoImpresion} onChange={e => set('tipoImpresion', e.target.value)}>
                      <option value="">Seleccionar...</option>
                      <option value="laser">Láser</option>
                      <option value="inkjet">Inkjet</option>
                      <option value="termica">Térmica</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Precio del tóner (COP)</label>
                    <input type="number" className="input-field" value={formData.precioToner} onChange={e => set('precioToner', e.target.value)} placeholder="0" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Costo prom. por impresión (COP)</label>
                    <input type="number" className="input-field" value={formData.costoPromImpresion} onChange={e => set('costoPromImpresion', e.target.value)} placeholder="0" />
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
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
                <Save size={16} /> {submitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Registrar Activo')}
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
        <input className="input-field" placeholder="Filtrar por cédula..." style={{ maxWidth: 200 }} value={filterCedula} onChange={e => setFilterCedula(e.target.value)} />
        <select className="input-field" style={{ maxWidth: 160 }} value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select className="input-field" style={{ maxWidth: 180 }} value={filterDispo} onChange={e => setFilterDispo(e.target.value)}>
          <option value="">Toda disponibilidad</option>
          <option value="disponible">Disponible</option>
          <option value="asignado">Asignado</option>
          <option value="prestado">En Préstamo</option>
          <option value="en reparacion">En Reparación</option>
        </select>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 12 }}>
        Mostrando {filtered.length} de {assets.length} activos
      </p>

      {/* Table */}
      <div className="section-card" style={{ overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Equipo</th>
              <th>Tipo</th>
              <th>Serial / Código</th>
              <th>Ubicación</th>
              <th>Asignado a</th>
              <th>Condición</th>
              <th>Disponibilidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={8}><div className="empty-state"><p>No se encontraron activos con esos filtros.</p></div></td></tr>
              : filtered.map(asset => (
                <React.Fragment key={asset.id}>
                  <tr>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>
                        {asset.identificador || '—'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {asset.marca} {asset.modelo}
                        {asset.procesador && <span> · {asset.procesador}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-asignado" style={{ textTransform: 'capitalize' }}>
                        {asset.subTipo || asset.tipo}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{asset.codigo}</td>
                    <td>{asset.ubicacion || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>
                      {asset.propietario
                        ? <div>
                          <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{asset.propietario.nombre}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>C.C. {asset.propietario.id}</div>
                        </div>
                        : <span style={{ color: 'var(--text-muted)' }}>Sin asignar</span>}
                    </td>
                    <td>
                      <span className={`badge ${asset.condicion === 'bueno' ? 'badge-activo' : asset.condicion === 'dañado' ? 'badge-inactivo' : 'badge-cambio'}`}>
                        {asset.condicion}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${BADGE_DISPO[asset.disponibilidad] || 'badge-baja'}`}>
                        {asset.disponibilidad}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Ver historial" onClick={() => setHistoryAsset(asset)}>
                          <History size={15} />
                        </button>
                        <button className="btn btn-outline btn-icon btn-sm" title="Expandir detalles" onClick={() => setExpandedRow(expandedRow === asset.id ? null : asset.id)}>
                          {expandedRow === asset.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                        <button className="btn btn-outline btn-icon btn-sm" title="Editar" onClick={() => handleEdit(asset)}>
                          <Edit2 size={15} />
                        </button>
                        <button className="btn btn-danger btn-icon btn-sm" title="Eliminar" onClick={() => handleDelete(asset.id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded row */}
                  {expandedRow === asset.id && (
                    <tr>
                      <td colSpan={8} style={{ padding: 0, background: 'rgba(0,82,165,0.02)' }}>
                        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                          <InfoItem label="Estado" value={asset.estado} />
                          {asset.valorAdquisicion && <InfoItem label="Valor adquisición" value={`$${Number(asset.valorAdquisicion).toLocaleString('es-CO')} COP`} />}
                          {asset.fechaAdquisicion && <InfoItem label="Fecha adquisición" value={new Date(asset.fechaAdquisicion).toLocaleDateString('es-CO')} />}
                          {asset.detallesAdicionales && <InfoItem label="Detalles adicionales" value={asset.detallesAdicionales} />}
                          {asset.notas && <InfoItem label="Notas" value={asset.notas} />}

                          {/* Celular details */}
                          {asset.cellphoneDetail && (
                            <>
                              {asset.cellphoneDetail.imei && <InfoItem label="IMEI 1" value={asset.cellphoneDetail.imei} mono />}
                              {asset.cellphoneDetail.imei2 && <InfoItem label="IMEI 2" value={asset.cellphoneDetail.imei2} mono />}
                              {asset.cellphoneDetail.phoneLine && (
                                <InfoItem label="Línea móvil" value={`${asset.cellphoneDetail.phoneLine.numero} — ${asset.cellphoneDetail.phoneLine.operador} · $${asset.cellphoneDetail.phoneLine.precioMensual?.toLocaleString() || '?'}/mes`} />
                              )}
                            </>
                          )}

                          {/* Printer details */}
                          {asset.printerDetail && (
                            <>
                              {asset.printerDetail.referenciaEquipo && <InfoItem label="Referencia" value={asset.printerDetail.referenciaEquipo} />}
                              {asset.printerDetail.tipoImpresion && <InfoItem label="Tipo impresión" value={asset.printerDetail.tipoImpresion} />}
                              {asset.printerDetail.precioToner && <InfoItem label="Precio tóner" value={`$${Number(asset.printerDetail.precioToner).toLocaleString('es-CO')} COP`} />}
                              {asset.printerDetail.costoPromImpresion && <InfoItem label="Costo x impresión" value={`$${Number(asset.printerDetail.costoPromImpresion).toLocaleString('es-CO')} COP`} />}
                            </>
                          )}
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

      {historyAsset && <AssetHistory asset={historyAsset} onClose={() => setHistoryAsset(null)} />}
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: '0.85rem', fontWeight: 500, fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</div>
  </div>
);

export default Assets;
