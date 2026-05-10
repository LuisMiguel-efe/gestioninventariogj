import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { Plus, Edit2, Trash2, Search, X, Save, Smartphone, Wifi } from 'lucide-react';

const OPERADORES = ['Claro', 'Movistar', 'Tigo', 'ETB', 'Avantel', 'WOM', 'Otro'];

const EMPTY_FORM = {
  numero: '', operador: 'Claro', planNombre: '', precioMensual: '',
  fechaActivacion: '', notas: '', activa: true,
};

const PhoneLines: React.FC = () => {
  const [lines, setLines] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(EMPTY_FORM);
  const [filterText, setFilterText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLines(await api.getPhoneLines());
  };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing) {
        await api.updatePhoneLine(formData.id, formData);
      } else {
        await api.addPhoneLine(formData);
      }
      setShowForm(false);
      setIsEditing(false);
      setFormData(EMPTY_FORM);
      fetchData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally { setSubmitting(false); }
  };

  const handleEdit = (line: any) => {
    setFormData({
      ...line,
      precioMensual: line.precioMensual ? String(line.precioMensual) : '',
      fechaActivacion: line.fechaActivacion ? line.fechaActivacion.split('T')[0] : '',
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar esta línea móvil? Se desvinculará de los celulares asignados.')) {
      await api.deletePhoneLine(id);
      fetchData();
    }
  };

  const filtered = useMemo(() => lines.filter(l => {
    const text = filterText.toLowerCase();
    return !filterText ||
      l.numero.toLowerCase().includes(text) ||
      l.operador.toLowerCase().includes(text) ||
      l.planNombre?.toLowerCase().includes(text);
  }), [lines, filterText]);

  const set = (field: string, value: any) => setFormData((p: any) => ({ ...p, [field]: value }));

  // Stats
  const totalMensual = lines.filter(l => l.activa && l.precioMensual).reduce((s, l) => s + l.precioMensual, 0);
  const activas = lines.filter(l => l.activa).length;
  const asignadas = lines.filter(l => l.cellphones && l.cellphones.length > 0).length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Líneas Móviles Corporativas</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            {lines.length} líneas registradas · Costo mensual total: <strong>${totalMensual.toLocaleString('es-CO')} COP</strong>
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setFormData(EMPTY_FORM); setIsEditing(false); setShowForm(s => !s); }}>
          {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Nueva Línea</>}
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0,82,165,0.1)', color: 'var(--primary-main)' }}>
            <Wifi size={22} />
          </div>
          <div><div className="stat-value">{lines.length}</div><div className="stat-label">Total Líneas</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(14,164,114,0.1)', color: 'var(--success)' }}>
            <Wifi size={22} />
          </div>
          <div><div className="stat-value" style={{ color: 'var(--success)' }}>{activas}</div><div className="stat-label">Líneas Activas</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(8,145,178,0.1)', color: '#0891b2' }}>
            <Smartphone size={22} />
          </div>
          <div><div className="stat-value" style={{ color: '#0891b2' }}>{asignadas}</div><div className="stat-label">Asignadas a Celular</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}>
            <Wifi size={22} />
          </div>
          <div>
            <div className="stat-value" style={{ color: '#7c3aed', fontSize: '1.3rem' }}>
              ${totalMensual.toLocaleString('es-CO')}
            </div>
            <div className="stat-label">Total Mensual COP</div>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="form-panel">
          <h2>{isEditing ? 'Editar Línea Móvil' : 'Registrar Nueva Línea Móvil'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="input-group">
                <label className="input-label">Número de Línea *</label>
                <input required className="input-field" value={formData.numero} onChange={e => set('numero', e.target.value)}
                  placeholder="Ej: 3001234567" disabled={isEditing} />
              </div>
              <div className="input-group">
                <label className="input-label">Operador *</label>
                <select required className="input-field" value={formData.operador} onChange={e => set('operador', e.target.value)}>
                  {OPERADORES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Nombre del Plan</label>
                <input className="input-field" value={formData.planNombre} onChange={e => set('planNombre', e.target.value)}
                  placeholder="Ej: Plan Empresarial 10GB" />
              </div>
              <div className="input-group">
                <label className="input-label">Precio Mensual (COP)</label>
                <input type="number" className="input-field" value={formData.precioMensual} onChange={e => set('precioMensual', e.target.value)}
                  placeholder="0" />
              </div>
              <div className="input-group">
                <label className="input-label">Fecha de Activación</label>
                <input type="date" className="input-field" value={formData.fechaActivacion} onChange={e => set('fechaActivacion', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Estado</label>
                <select className="input-field" value={String(formData.activa)} onChange={e => set('activa', e.target.value === 'true')}>
                  <option value="true">Activa</option>
                  <option value="false">Inactiva</option>
                </select>
              </div>
              <div className="input-group span-2">
                <label className="input-label">Notas</label>
                <textarea className="input-field" rows={2} value={formData.notas} onChange={e => set('notas', e.target.value)}
                  placeholder="Observaciones, condiciones del plan, etc." />
              </div>
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Save size={16} /> {submitting ? 'Guardando...' : 'Guardar Línea'}
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
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="input-field" placeholder="Buscar por número, operador o plan..." style={{ paddingLeft: 34 }} value={filterText} onChange={e => setFilterText(e.target.value)} />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', alignSelf: 'center' }}>
          {filtered.length} de {lines.length} líneas
        </p>
      </div>

      {/* Table */}
      <div className="section-card" style={{ overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Operador</th>
              <th>Plan</th>
              <th>Precio Mensual</th>
              <th>Activación</th>
              <th>Celular Asignado</th>
              <th>Estado</th>
              <th>Notas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={9}><div className="empty-state"><Wifi size={36} /><p>No hay líneas móviles registradas.</p></div></td></tr>
              : filtered.map(line => {
                const celular = line.cellphones?.[0];
                return (
                  <tr key={line.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem' }}>{line.numero}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(0,82,165,0.1)', color: 'var(--primary-main)' }}>
                        {line.operador}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{line.planNombre || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ fontWeight: 600 }}>
                      {line.precioMensual
                        ? <span style={{ color: '#7c3aed' }}>${Number(line.precioMensual).toLocaleString('es-CO')}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {line.fechaActivacion ? new Date(line.fechaActivacion).toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {celular
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Smartphone size={14} style={{ color: '#0891b2' }} />
                          <span style={{ fontWeight: 500 }}>{celular.asset?.identificador || celular.asset?.codigo || '—'}</span>
                        </div>
                        : <span style={{ color: 'var(--text-muted)' }}>Sin asignar</span>}
                    </td>
                    <td>
                      <span className={`badge ${line.activa ? 'badge-activo' : 'badge-inactivo'}`}>
                        {line.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 150 }}>
                      <span title={line.notas || ''} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {line.notas || '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-icon btn-sm" onClick={() => handleEdit(line)} title="Editar"><Edit2 size={15} /></button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(line.id)} title="Eliminar"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PhoneLines;
