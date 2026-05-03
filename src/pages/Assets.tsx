import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const Assets: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [filterIdentificador, setFilterIdentificador] = useState('');
  const [filterDisponibilidad, setFilterDisponibilidad] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>({
    codigo: '', identificador: '', tipo: 'laptop', marca: '', modelo: '', procesador: '', detallesAdicionales: '', estado: 'activo', disponibilidad: 'disponible', ubicacion: ''
  });

  const fetchData = async () => {
    setAssets(await api.getAssets());
    setUsers(await api.getUsers());
  };

  useEffect(() => { fetchData() }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
      await api.updateAsset(formData.id, formData);
    } else {
      await api.addAsset(formData);
    }
    setShowForm(false);
    setFormData({ codigo: '', identificador: '', tipo: 'laptop', marca: '', modelo: '', procesador: '', detallesAdicionales: '', estado: 'activo', disponibilidad: 'disponible', ubicacion: '' });
    fetchData();
  };

  const deleteAsset = async (id: number) => {
    if (confirm('¿Eliminar activo?')) {
      await api.deleteAsset(id);
      fetchData();
    }
  };

  const getOwnerName = (id?: string | number) => {
    const user = users.find(u => String(u.id) === String(id));
    return user ? user.nombre : 'Ninguno';
  };

  const filteredAssets = assets.filter(a => {
    const checkIdentificador = a.identificador?.toLowerCase().includes(filterIdentificador.toLowerCase()) || a.codigo.toLowerCase().includes(filterIdentificador.toLowerCase());
    const checkDisponibilidad = filterDisponibilidad === '' || a.disponibilidad === filterDisponibilidad;
    return checkIdentificador && checkDisponibilidad;
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.875rem' }}>Inventario de Activos</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> Nuevo Activo
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input 
          className="input-field" 
          placeholder="Buscar por Identificador o Código..." 
          style={{ flex: 1, minWidth: '250px' }}
          value={filterIdentificador} 
          onChange={(e) => setFilterIdentificador(e.target.value)} 
        />
        <select 
          className="input-field" 
          value={filterDisponibilidad} 
          onChange={(e) => setFilterDisponibilidad(e.target.value)}
        >
          <option value="">Todas las disponibilidades</option>
          <option value="disponible">Disponible</option>
          <option value="asignado">Asignado</option>
          <option value="en reparacion">En Reparación</option>
        </select>
      </div>

      {showForm && (
        <div style={{ background: 'var(--surface-solid)', padding: '24px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ marginBottom: '16px' }}>{formData.id ? 'Editar' : 'Crear'} Activo</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Código (Serial/Plaqueta)</label>
              <input required className="input-field" value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">Identificador (ej. laptop53)</label>
              <input className="input-field" value={formData.identificador || ''} onChange={e => setFormData({ ...formData, identificador: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">Tipo</label>
              <select className="input-field" value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })}>
                <option value="laptop">Laptop</option>
                <option value="desktop">Desktop</option>
                <option value="impresora">Impresora</option>
                <option value="accesorio">Accesorio</option>
              </select>
            </div>
            <div className="input-group">
               <label className="input-label">Marca</label>
               <input required className="input-field" value={formData.marca} onChange={e => setFormData({ ...formData, marca: e.target.value })} />
            </div>
            <div className="input-group">
               <label className="input-label">Modelo</label>
               <input required className="input-field" value={formData.modelo} onChange={e => setFormData({ ...formData, modelo: e.target.value })} />
            </div>
            <div className="input-group">
               <label className="input-label">Procesador</label>
               <input className="input-field" value={formData.procesador || ''} onChange={e => setFormData({ ...formData, procesador: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">Estado Técnico</label>
              <select className="input-field" value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Disponibilidad</label>
              <select className="input-field" value={formData.disponibilidad} onChange={e => setFormData({ ...formData, disponibilidad: e.target.value })}>
                <option value="disponible">Disponible</option>
                <option value="asignado">Asignado</option>
                <option value="en reparacion">En Reparación</option>
              </select>
            </div>
            <div className="input-group">
               <label className="input-label">Ubicación (Área)</label>
               <input required className="input-field" value={formData.ubicacion} onChange={e => setFormData({ ...formData, ubicacion: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">Propietario / Asignado A</label>
              <select className="input-field" value={formData.propietarioId || ''} onChange={e => setFormData({ ...formData, propietarioId: e.target.value ? e.target.value : undefined })}>
                <option value="">Ninguno</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.nombre} - {u.id}</option>)}
              </select>
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
               <label className="input-label">Detalles Adicionales</label>
               <textarea className="input-field" value={formData.detallesAdicionales || ''} onChange={e => setFormData({ ...formData, detallesAdicionales: e.target.value })} rows={2} />
            </div>
            
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
               <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>Guardar Activo</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ overflowX: 'auto', background: 'var(--surface-solid)', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', background: 'var(--bg-color)' }}>
              <th style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>Identificador / Equipo</th>
              <th style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>Código Serial</th>
              <th style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>Ubicación</th>
              <th style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>Asignado A</th>
              <th style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>Estado</th>
              <th style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>Disponibilidad</th>
              <th style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map(asset => (
              <tr key={asset.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 12px' }}>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--primary-dark)' }}>
                    {asset.identificador ? asset.identificador : 'Sin Identificador'}
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{asset.tipo} - {asset.marca} {asset.modelo}</div>
                </td>
                <td style={{ padding: '16px 12px', fontSize: '0.875rem' }}>{asset.codigo}</td>
                <td style={{ padding: '16px 12px' }}>{asset.ubicacion}</td>
                <td style={{ padding: '16px 12px' }}>{getOwnerName(asset.propietarioId)}</td>
                <td style={{ padding: '16px 12px' }}>
                  <span className={`badge badge-${asset.estado}`}>{asset.estado}</span>
                </td>
                <td style={{ padding: '16px 12px' }}>
                  <span className={`badge badge-${asset.disponibilidad.replace(' ', '')}`}>{asset.disponibilidad}</span>
                </td>
                <td style={{ padding: '16px 12px', display: 'flex', gap: '8px' }}>
                  <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => { setFormData(asset); setShowForm(true); }}>
                    <Edit2 size={16} />
                  </button>
                  <button className="btn btn-outline" style={{ padding: '6px', color: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => deleteAsset(asset.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {assets.length === 0 && <p style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay activos en el inventario.</p>}
      </div>
    </div>
  );
}

export default Assets;
