import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
};

const SearchableSelect = ({ label, options, value, onSelect, placeholder, disabled = false }: any) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const selected = options.find((o: any) => o.value === value);
    if (selected) {
      setSearch(selected.label);
    } else {
      setSearch('');
    }
  }, [value, options]);

  const filteredOptions = options.filter((o: any) => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="input-group" style={{ position: 'relative' }}>
      <label className="input-label">{label}</label>
      <input
        className="input-field"
        placeholder={placeholder}
        value={search}
        disabled={disabled}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
      />
      {isOpen && !disabled && (
        <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', zIndex: 10, maxHeight: '200px', overflowY: 'auto', listStyle: 'none', padding: 0, margin: 0, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {filteredOptions.length > 0 ? filteredOptions.map((o: any) => (
            <li
              key={o.value}
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}
              onMouseDown={() => {
                setSearch(o.label);
                setIsOpen(false);
                onSelect(o.value);
              }}
            >
              {o.label}
            </li>
          )) : <li style={{ padding: '8px 12px', color: '#94a3b8' }}>Sin coincidencias</li>}
        </ul>
      )}
    </div>
  );
};

const Movements: React.FC = () => {
  const [movements, setMovements] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [filterCedula, setFilterCedula] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>({
    assetId: 0,
    assetAnteriorId: 0,
    userId: '',
    tipo: 'asignacion',
    notas: ''
  });

  const fetchData = async () => {
    setMovements(await api.getMovements());
    setAssets(await api.getAssets());
    setUsers(await api.getUsers());
  };

  useEffect(() => { fetchData() }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.assetId === 0 || !formData.userId) return;
    if (formData.tipo === 'cambio' && formData.assetAnteriorId === 0) return;

    const newMovement = {
      ...formData,
      registradoPorId: '94152348', // Simulated current connected admin user
      fecha: new Date().toISOString()
    };

    // Save Movement history
    const insertedMovementId = await api.addMovement(newMovement);

    // 1. Process main asset Logic
    const asset = assets.find(a => a.id === formData.assetId);
    if (asset) {
      const updatedAsset = { ...asset };
      if (formData.tipo === 'asignacion' || formData.tipo === 'cambio') {
        updatedAsset.disponibilidad = 'asignado';
        updatedAsset.propietarioId = formData.userId;
        const assignedUser = users.find(u => String(u.id) === String(formData.userId));
        if (assignedUser) updatedAsset.ubicacion = assignedUser.departamento;
      } else if (formData.tipo === 'devolucion') {
        updatedAsset.disponibilidad = 'disponible';
        updatedAsset.propietarioId = undefined; // unassign
        updatedAsset.ubicacion = 'Bodega Compras';
      }
      await api.updateAsset(asset.id, updatedAsset);
    }

    // 2. Process Old Asset Logic (in case of 'Cambio')
    if (formData.tipo === 'cambio' && formData.assetAnteriorId !== 0) {
      const oldAsset = assets.find(a => a.id === formData.assetAnteriorId);
      if (oldAsset) {
        const updatedOldAsset = { ...oldAsset };
        updatedOldAsset.disponibilidad = 'disponible';
        updatedOldAsset.propietarioId = undefined;
        updatedOldAsset.ubicacion = 'Bodega Compras';
        await api.updateAsset(oldAsset.id, updatedOldAsset);
      }
    }

    // Reset and Refresh
    setShowForm(false);
    setFormData({ assetId: 0, assetAnteriorId: 0, userId: '', tipo: 'asignacion', notas: '' });
    fetchData();

    // Trigger Print
    generatePDF({ ...newMovement, id: insertedMovementId || Math.floor(Math.random() * 1000) });
  };

  const generatePDF = async (movement: any) => {
    const doc = new jsPDF();
    const asset = assets.find(a => a.id === movement.assetId);
    const assetAnterior = assets.find(a => a.id === movement.assetAnteriorId);
    const user = users.find(u => u.id === movement.userId);

    let headerImg: HTMLImageElement | null = null;
    let footerImg: HTMLImageElement | null = null;
    try {
      headerImg = await loadImage('/header.png');
      footerImg = await loadImage('/footer.png');
    } catch (err) {
      console.warn('No se encontraron header.png o footer.png en la carpeta public');
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    const fechaFormat = new Date(movement.fecha).toLocaleDateString();
    doc.text(`Santiago de Cali, ${fechaFormat}`, 14, 45);
    doc.text('Cordial saludo.', 14, 55);

    if (movement.tipo === 'cambio') {
      doc.text(`Mediante el presente documento se hace CAMBIO de un equipo con los siguientes detalles:`, 14, 65);
    } else {
      doc.text(`Mediante el presente documento se hace ${movement.tipo.toUpperCase()} de un equipo con los siguientes detalles:`, 14, 65);
    }

    // Detail Tables
    autoTable(doc, {
      startY: 70,
      head: [[movement.tipo === 'cambio' ? 'Detalles del Activo Nuevo (Entrega)' : 'Detalles del Activo', '']],
      body: [
        ['Identificador', asset?.identificador || 'N/A'],
        ['Equipo', `${asset?.tipo?.toUpperCase() || 'N/A'} - ${asset?.marca} ${asset?.modelo}`],
        ['Procesador', asset?.procesador || 'N/A'],
        ['Estado Técnico', asset?.estado?.toUpperCase() || 'N/A'],
        ['Anterior colaborador', asset?.propietarioId?.nombre || 'N/A'],
        ['Detalles Adicionales', asset?.detallesAdicionales || 'Ninguno'],
        ['Notas de Movimiento', movement.notas || 'Ninguna']
      ],
      theme: 'grid',
      headStyles: { fillColor: [0, 119, 182] }
    });

    if (movement.tipo === 'cambio' && assetAnterior) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Detalles del Activo Anterior (Devolución)', '']],
        body: [
          ['Identificador', assetAnterior.identificador || 'N/A'],
          ['Código', assetAnterior.codigo || 'N/A'],
          ['Equipo', `${assetAnterior.tipo?.toUpperCase() || 'N/A'} - ${assetAnterior.marca} ${assetAnterior.modelo}`],
          ['Procesador', assetAnterior.procesador || 'N/A'],
          ['Estado Técnico', assetAnterior.estado?.toUpperCase() || 'N/A'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [0, 119, 182] }
      });
    }

    // Signatures dynamic swap
    let finalY = (doc as any).lastAutoTable.finalY + 30;

    // Check if new page is needed for signatures
    if (finalY > 250) {
      doc.addPage();
      finalY = 40;
    }

    const adminDetails = {
      nombre: 'Gustavo Adolfo Franco',
      cedula: '94152348',
      cargo: 'Jefe de Compras',
      correo: 'compras@administracionesgj.com',
    };

    const userDetails = {
      nombre: user?.nombre || '',
      cedula: user?.id || '',
      cargo: user?.departamento || '',
      correo: user?.email || '',
    };

    // If "devolucion", User yields to Admin. Else (asignacion, cambio), Admin yields to User
    const [personEntrega, personRecibe] = movement.tipo === 'devolucion'
      ? [userDetails, adminDetails]
      : [adminDetails, userDetails];

    doc.line(20, finalY, 80, finalY);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Firma quien entrega', 20, finalY + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${personEntrega.nombre}`, 20, finalY + 12);
    doc.text(`C.C: ${personEntrega.cedula}`, 20, finalY + 18);
    doc.text(`Cargo: ${personEntrega.cargo}`, 20, finalY + 24);
    doc.text(`Correo: ${personEntrega.correo}`, 20, finalY + 30);

    doc.line(120, finalY, 180, finalY);
    doc.setFont('helvetica', 'bold');
    doc.text('Firma quien recibe', 120, finalY + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${personRecibe.nombre}`, 120, finalY + 12);
    doc.text(`C.C: ${personRecibe.cedula}`, 120, finalY + 18);
    doc.text(`Cargo: ${personRecibe.cargo}`, 120, finalY + 24);
    doc.text(`Correo: ${personRecibe.correo}`, 120, finalY + 30);

    // Add header and footer to every page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      if (headerImg) {
        const imgRatio = headerImg.width / headerImg.height;
        const pdfWidth = 210;
        const pdfHeight = pdfWidth / imgRatio;
        doc.addImage(headerImg, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      if (footerImg) {
        const imgRatio = footerImg.width / footerImg.height;
        const pdfWidth = 210;
        const pdfHeight = pdfWidth / imgRatio;
        doc.addImage(footerImg, 'PNG', 0, 297 - pdfHeight, pdfWidth, pdfHeight);
      }
    }

    doc.save(`Acta_${user?.id}_${movement.tipo}.pdf`);
  };

  const getAssetName = (id: number) => {
    const asset = assets.find(a => a.id === id);
    return asset ? `${asset.identificador || asset.codigo} - ${asset.tipo}` : 'Desconocido';
  };
  const getUserName = (id: string | number) => {
    const user = users.find(u => u.id === id || String(u.id) === String(id));
    return user ? user.nombre : 'Desconocido';
  };

  const filteredMovements = movements.filter(m => {
    if (!filterCedula) return true;
    return String(m.userId).includes(filterCedula);
  });



  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.875rem' }}>Registro de Movimientos</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> Registrar Movimiento
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input 
          className="input-field" 
          placeholder="Filtrar por Cédula del Empleado..." 
          style={{ flex: 1, minWidth: '250px' }}
          value={filterCedula} 
          onChange={(e) => setFilterCedula(e.target.value)} 
        />
      </div>

      {showForm && (
        <div style={{ background: 'var(--surface-solid)', padding: '24px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ marginBottom: '16px' }}>Nuevo Registro</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Tipo de Movimiento</label>
              <select className="input-field" value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value, assetId: 0, userId: '', assetAnteriorId: 0 })}>
                <option value="asignacion">Asignación</option>
                <option value="devolucion">Devolución</option>
                <option value="cambio">Cambio</option>
              </select>
            </div>

            <SearchableSelect
              value={formData.assetId}
              label={formData.tipo === 'cambio' ? 'Equipo de Reemplazo (A entregar al usuario)' : 'Activo Involucrado'}
              placeholder="Busca por identificador o codigo..."
              options={assets.filter(a => {
                if (formData.tipo === 'asignacion' && a.disponibilidad !== 'disponible') return false;
                if (formData.tipo === 'devolucion' && a.disponibilidad !== 'asignado') return false;
                if (formData.tipo === 'cambio' && a.disponibilidad !== 'disponible') return false;
                return true;
              }).map(a => ({ value: a.id, label: `${a.identificador || a.codigo} | ${a.tipo} (${a.marca})` }))}
              onSelect={(val: number) => {
                const found = assets.find(a => a.id === val);
                if (found && formData.tipo === 'devolucion' && found.propietarioId) {
                  setFormData({ ...formData, assetId: found.id, userId: found.propietarioId });
                } else {
                  setFormData({ ...formData, assetId: found ? found.id : 0 });
                }
              }}
            />

            {formData.tipo === 'cambio' && (
              <SearchableSelect
                value={formData.assetAnteriorId}
                label="Equipo Entrante (A devolver al inventario)"
                placeholder="Busca el equipo antiguo a devolver..."
                options={assets.filter(a => a.disponibilidad === 'asignado').map((a) => ({ value: a.id, label: `${a.identificador || a.codigo} | ${a.tipo} (${a.marca})` }))}
                onSelect={(val: number) => setFormData({ ...formData, assetAnteriorId: val })}
              />
            )}

            <div className="input-group">
              <label className="input-label">Usuario / Empleado</label>
              <select required className="input-field" value={formData.userId} disabled={formData.tipo === 'devolucion'} onChange={e => setFormData({ ...formData, userId: e.target.value })}>
                <option value="">Seleccione un usuario...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.nombre} - {u.id}</option>)}
              </select>
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Notas Adicionales</label>
              <textarea className="input-field" value={formData.notas} onChange={e => setFormData({ ...formData, notas: e.target.value })} rows={3} />
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>Guardar Registro</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ overflowX: 'auto', background: 'var(--surface-solid)', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', background: 'var(--bg-color)' }}>
              <th style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>ID/Fecha</th>
              <th style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>Tipo</th>
              <th style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>Activo</th>
              <th style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>Usuario Involucrado</th>
              <th style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>Acta PDF</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 12px' }}>
                  <div style={{ fontWeight: 600 }}>#{m.id}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(m.fecha).toLocaleDateString()}</div>
                </td>
                <td style={{ padding: '16px 12px' }}>
                  <span className="badge" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--primary-dark)' }}>{m.tipo}</span>
                </td>
                <td style={{ padding: '16px 12px' }}>{getAssetName(m.assetId)}</td>
                <td style={{ padding: '16px 12px' }}>{getUserName(m.userId)}</td>
                <td style={{ padding: '16px 12px' }}>
                  <button className="btn btn-outline" style={{ padding: '6px 12px' }} onClick={() => generatePDF(m)}>
                    <Printer size={16} /> Imprimir Acta
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMovements.length === 0 && <p style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No se encontraron movimientos.</p>}
      </div>
    </div>
  );
}

export default Movements;
