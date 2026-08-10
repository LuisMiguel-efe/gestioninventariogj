import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Plus, Printer, Search, X, Save, Clock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
 
const TIPOS_MOVIMIENTO = [
  { value: 'asignacion', label: 'Asignación', desc: 'Entregar una herramienta disponible a un empleado' },
  { value: 'devolucion', label: 'Devolución', desc: 'Devolver una herramienta asignada al inventario' },
  { value: 'cambio', label: 'Cambio', desc: 'Reemplazar una herramienta por otra (devolución + asignación simultánea)' },
  { value: 'prestamo', label: 'Préstamo', desc: 'Entregar temporalmente una herramienta a un empleado' },
  { value: 'retorno_prestamo', label: 'Retorno Préstamo', desc: 'Devolver una herramienta prestada al inventario' },
];
 
const MOVIMIENTO_LABELS: Record<string, string> = Object.fromEntries(TIPOS_MOVIMIENTO.map(t => [t.value, t.label]));
 
const CONDICIONES = ['bueno', 'regular', 'dañado'];
 
const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image(); img.src = url;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
 
const SearchableSelect = ({ label, options, value, onSelect, placeholder, disabled = false }: any) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
 
  useEffect(() => {
    const selected = options.find((o: any) => o.value === value);
    setSearch(selected ? selected.label : '');
  }, [value, options]);
 
  const filtered = options.filter((o: any) => o.label.toLowerCase().includes(search.toLowerCase()));
 
  return (
    <div className="input-group" style={{ position: 'relative' }}>
      <label className="input-label">{label}</label>
      <input
        className="input-field"
        placeholder={placeholder}
        value={search}
        disabled={disabled}
        onFocus={() => !disabled && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 180)}
        onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
      />
      {isOpen && !disabled && (
        <ul className="searchable-dropdown">
          {filtered.length > 0
            ? filtered.map((o: any) => (
              <li key={o.value} onMouseDown={() => { setSearch(o.label); setIsOpen(false); onSelect(o.value); }}>
                {o.label}
              </li>
            ))
            : <li style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin coincidencias</li>
          }
        </ul>
      )}
    </div>
  );
};
 
const HerramientaMovements: React.FC = () => {
  const { sessionUser } = useAuth();
  const navigate = useNavigate();
  const [movements, setMovements] = useState<any[]>([]);
  const [herramientas, setHerramientas] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
 
  const [filterCedula, setFilterCedula] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
 
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({
    herramientaId: 0,
    secondaryHerramientaId: 0,
    userId: '',
    tipo: 'asignacion',
    fecha: new Date().toISOString().split('T')[0],
    condicionEntrega: 'bueno',
    condicionRecepcion: 'bueno',
    fechaRetornoPrevista: '',
    notas: '',
  });
 
  const fetchData = async () => {
    const [m, h, u] = await Promise.all([api.getHerramientaMovements(), api.getHerramientas(), api.getUsers()]);
    setMovements(m); setHerramientas(h); setUsers(u);
  };
  useEffect(() => { fetchData(); }, []);
 
  const set = (field: string, value: any) => setFormData((p: any) => ({ ...p, [field]: value }));
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.herramientaId || !formData.userId) return;
    if (formData.tipo === 'cambio' && !formData.secondaryHerramientaId) {
      alert('Para un cambio debes seleccionar la herramienta anterior a devolver.');
      return;
    }
    setSubmitting(true);
    try {
      const registradoPorId = sessionUser?.cedula || '00000000';
      const newMovement = { ...formData, registradoPorId, fecha: new Date(formData.fecha).toISOString() };
      const result = await api.addHerramientaMovement(newMovement);
 
      const herramienta = herramientas.find(h => h.id === formData.herramientaId);
      const assignedUser = users.find(u => String(u.id) === String(formData.userId));
 
      if (herramienta) {
        const baseUpdate = {
          codigo: herramienta.codigo,
          identificador: herramienta.identificador,
          nombre: herramienta.nombre,
          categoria: herramienta.categoria,
          marca: herramienta.marca,
          modelo: herramienta.modelo,
          condicion: formData.condicionEntrega || herramienta.condicion,
          estado: herramienta.estado,
          disponibilidad: herramienta.disponibilidad,
          cantidad: herramienta.cantidad,
          ubicacion: herramienta.ubicacion,
          departamentoId: herramienta.departamentoId,
          propietarioId: herramienta.propietarioId,
          fechaAdquisicion: herramienta.fechaAdquisicion,
          valorAdquisicion: herramienta.valorAdquisicion,
          notas: herramienta.notas,
          detallesAdicionales: herramienta.detallesAdicionales,
        };
 
        if (['asignacion', 'cambio', 'prestamo'].includes(formData.tipo)) {
          baseUpdate.disponibilidad = formData.tipo === 'prestamo' ? 'prestado' : 'asignado';
          baseUpdate.propietarioId = formData.userId;
          if (assignedUser?.departamento) baseUpdate.ubicacion = assignedUser.departamento.nombre;
        } else if (['devolucion', 'retorno_prestamo'].includes(formData.tipo)) {
          baseUpdate.disponibilidad = 'disponible';
          baseUpdate.propietarioId = null;
          baseUpdate.ubicacion = 'Bodega Compras';
        }
        await api.updateHerramienta(herramienta.id, baseUpdate);
      }
 
      if (formData.tipo === 'cambio' && formData.secondaryHerramientaId) {
        const oldHerramienta = herramientas.find(h => h.id === formData.secondaryHerramientaId);
        if (oldHerramienta) {
          const oldBaseUpdate = {
            codigo: oldHerramienta.codigo,
            identificador: oldHerramienta.identificador,
            nombre: oldHerramienta.nombre,
            categoria: oldHerramienta.categoria,
            marca: oldHerramienta.marca,
            modelo: oldHerramienta.modelo,
            condicion: formData.condicionRecepcion || oldHerramienta.condicion,
            estado: oldHerramienta.estado,
            disponibilidad: 'disponible',
            cantidad: oldHerramienta.cantidad,
            ubicacion: 'Bodega Compras',
            departamentoId: oldHerramienta.departamentoId,
            propietarioId: null,
            fechaAdquisicion: oldHerramienta.fechaAdquisicion,
            valorAdquisicion: oldHerramienta.valorAdquisicion,
            notas: oldHerramienta.notas,
            detallesAdicionales: oldHerramienta.detallesAdicionales,
          };
          await api.updateHerramienta(oldHerramienta.id, oldBaseUpdate);
        }
      }
 
      setShowForm(false);
      setFormData({ herramientaId: 0, secondaryHerramientaId: 0, userId: '', tipo: 'asignacion', fecha: new Date().toISOString().split('T')[0], condicionEntrega: 'bueno', condicionRecepcion: 'bueno', fechaRetornoPrevista: '', notas: '' });
      await fetchData();
 
      generatePDF({ ...newMovement, id: result?.id || Math.random() });
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally { setSubmitting(false); }
  };
 
  const generatePDF = async (movement: any) => {
    const herramienta = herramientas.find(h => h.id === movement.herramientaId);
    const secondaryHerramienta = herramientas.find(h => h.id === movement.secondaryHerramientaId);
    const user = users.find(u => String(u.id) === String(movement.userId));
    const registrador = users.find(u => String(u.id) === String(movement.registradoPorId));
 
    let membreteImg: HTMLImageElement | null = null;
    try { membreteImg = await loadImage('/membretegj.png'); } catch { }
 
    const drawMembrete = () => {
      if (membreteImg) {
        doc.addImage(membreteImg, 'PNG', 0, 0, 210, 297);
      }
    };
 
    const doc = new jsPDF();
    drawMembrete();
 
    const fechaFormat = new Date(movement.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const tipoLabel = MOVIMIENTO_LABELS[movement.tipo] || movement.tipo;
 
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(`Santiago de Cali, ${fechaFormat}`, 14, 48);
    doc.text('Cordial saludo.', 14, 56);
    doc.text(`Mediante el presente documento se registra ${tipoLabel.toUpperCase()} de herramienta con los siguientes detalles:`, 14, 64);
 
    const didAddPage = () => { drawMembrete(); };
 
    autoTable(doc, {
      startY: 70,
      head: [[movement.tipo === 'cambio' ? 'Herramienta a Entregar' : `Herramienta — ${tipoLabel}`, 'Información']],
      body: [
        ['Identificador', herramienta?.identificador || herramienta?.nombre || '—'],
        ['Nombre / Categoría', `${herramienta?.nombre || '?'} — ${herramienta?.categoria || ''}`],
        ['Marca / Modelo', `${herramienta?.marca || ''} ${herramienta?.modelo || ''}`],
        ['Serial / Código', herramienta?.codigo || '—'],
        ['Condición de Entrega', movement.condicionEntrega || '—'],
        ['Detalles Adicionales', herramienta?.detallesAdicionales || 'Ninguno'],
        ['Notas del Movimiento', movement.notas || 'Ninguna'],
        ...(movement.tipo === 'prestamo' && movement.fechaRetornoPrevista
          ? [['Fecha de Retorno Prevista', new Date(movement.fechaRetornoPrevista).toLocaleDateString('es-CO')]]
          : []),
      ],
      theme: 'grid',
      headStyles: { fillColor: false, textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
      didDrawPage: didAddPage,
    });
 
    if (movement.tipo === 'cambio' && secondaryHerramienta) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 8,
        head: [['Herramienta a Devolver', 'Información']],
        body: [
          ['Identificador', secondaryHerramienta.identificador || secondaryHerramienta.nombre || '—'],
          ['Nombre / Categoría', `${secondaryHerramienta.nombre || '?'} — ${secondaryHerramienta.categoria || ''}`],
          ['Serial / Código', secondaryHerramienta.codigo || '—'],
          ['Condición de Recepción', movement.condicionRecepcion || '—'],
        ],
        theme: 'grid',
        headStyles: { fillColor: false, textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
        didDrawPage: didAddPage,
      });
    }
 
    let currentY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const condicionesText = "Condiciones de Uso: La presente herramienta es un elemento de trabajo proporcionado exclusivamente para el desempeño de sus labores en la empresa. El empleado se compromete a darle un uso adecuado, velar por su cuidado y seguridad. Asimismo, se compromete a reportar de manera inmediata cualquier fallo, daño, pérdida o robo. En caso de comprobarse que la herramienta sufrió daños, pérdida o afectación por negligencia, descuido o mal uso, el empleado asumirá la responsabilidad y/o los costos correspondientes de reparación o reposición.";
    const splitCondiciones = doc.splitTextToSize(condicionesText, 182);
 
    if (currentY + (splitCondiciones.length * 4) + 40 > 270) {
      doc.addPage();
      drawMembrete();
      currentY = 20;
    }
 
    doc.text(splitCondiciones, 14, currentY);
 
    let finalY = currentY + (splitCondiciones.length * 4) + 24;
 
    const adminInfo = registrador
      ? { nombre: registrador.nombre, cedula: registrador.id, cargo: registrador.cargo || 'Administrador', correo: registrador.email || '' }
      : { nombre: sessionUser?.nombre || 'Administrador', cedula: sessionUser?.cedula || '', cargo: sessionUser?.cargo || '', correo: sessionUser?.email || '' };
 
    const userInfo = {
      nombre: user?.nombre || movement.userId,
      cedula: user?.id || movement.userId,
      cargo: user?.cargo || user?.departamento?.nombre || '',
      correo: user?.email || '',
    };
 
    const [entrega, recibe] = ['devolucion', 'retorno_prestamo'].includes(movement.tipo)
      ? [userInfo, adminInfo]
      : [adminInfo, userInfo];
 
    doc.line(14, finalY, 74, finalY);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('Firma quien entrega:', 14, finalY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${entrega.nombre}`, 14, finalY + 11);
    doc.text(`C.C: ${entrega.cedula}`, 14, finalY + 17);
    if (entrega.cargo) doc.text(`Cargo: ${entrega.cargo}`, 14, finalY + 23);
    if (entrega.correo) doc.text(`Correo: ${entrega.correo}`, 14, finalY + 29);
 
    doc.line(120, finalY, 180, finalY);
    doc.setFont('helvetica', 'bold');
    doc.text('Firma quien recibe:', 120, finalY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${recibe.nombre}`, 120, finalY + 11);
    doc.text(`C.C: ${recibe.cedula}`, 120, finalY + 17);
    if (recibe.cargo) doc.text(`Cargo: ${recibe.cargo}`, 120, finalY + 23);
    if (recibe.correo) doc.text(`Correo: ${recibe.correo}`, 120, finalY + 29);
 
    doc.save(`Acta_Herramienta_${tipoLabel}_${user?.id || movement.userId}_${new Date().toISOString().split('T')[0]}.pdf`);
  };
 
  const filteredMovements = useMemo(() => movements.filter(m => {
    const matchCedula = !filterCedula || String(m.userId).includes(filterCedula) || String(m.registradoPorId).includes(filterCedula);
    const matchTipo = !filterTipo || m.tipo === filterTipo;
    return matchCedula && matchTipo;
  }), [movements, filterCedula, filterTipo]);
 
  const mainHerramientaOptions = useMemo(() => herramientas.filter(h => {
    if (formData.tipo === 'asignacion') return h.disponibilidad === 'disponible';
    if (formData.tipo === 'devolucion') return h.disponibilidad === 'asignado';
    if (formData.tipo === 'cambio') return h.disponibilidad === 'disponible';
    if (formData.tipo === 'prestamo') return h.disponibilidad === 'disponible';
    if (formData.tipo === 'retorno_prestamo') return h.disponibilidad === 'prestado';
    return true;
  }).map(h => ({ value: h.id, label: `${h.identificador || h.codigo} | ${h.nombre} — ${h.marca} ${h.modelo}` })), [herramientas, formData.tipo]);
 
  const secondaryHerramientaOptions = useMemo(() =>
    herramientas.filter(h => h.disponibilidad === 'asignado')
      .map(h => ({ value: h.id, label: `${h.identificador || h.codigo} | ${h.nombre} — ${h.marca} ${h.modelo}` })),
    [herramientas]);
 
  const userOptions = useMemo(() =>
    users.map(u => ({ value: u.id, label: `${u.nombre} — C.C. ${u.id}` })),
    [users]);
 
  const currentTipoInfo = TIPOS_MOVIMIENTO.find(t => t.value === formData.tipo);
  const isDevolucionType = ['devolucion', 'retorno_prestamo'].includes(formData.tipo);
 
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }} onClick={() => navigate('/movements')}>
            <ArrowLeft size={14} /> Volver a Movimientos de Activos
          </button>
          <h1>Actas de Herramientas</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            {movements.length} movimientos registrados — Trazabilidad de herramientas de construcción
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Registrar Movimiento</>}
        </button>
      </div>
 
      {showForm && (
        <div className="form-panel">
          <h2>Nuevo Registro de Movimiento de Herramienta</h2>
 
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {TIPOS_MOVIMIENTO.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setFormData({ herramientaId: 0, secondaryHerramientaId: 0, userId: '', tipo: t.value, fecha: new Date().toISOString().split('T')[0], condicionEntrega: 'bueno', condicionRecepcion: 'bueno', fechaRetornoPrevista: '', notas: '' })}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: `2px solid ${formData.tipo === t.value ? 'var(--primary-main)' : '#d1dbe8'}`,
                  background: formData.tipo === t.value ? 'var(--primary-subtle)' : 'white',
                  cursor: 'pointer',
                  fontWeight: formData.tipo === t.value ? 700 : 500,
                  color: formData.tipo === t.value ? 'var(--primary-dark)' : 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
 
          {currentTipoInfo && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20, background: 'rgba(0,82,165,0.05)', padding: '10px 14px', borderRadius: 8 }}>
              ℹ️ {currentTipoInfo.desc}
            </p>
          )}
 
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <SearchableSelect
                label={formData.tipo === 'cambio' ? 'Herramienta Nueva (a Entregar)' : 'Herramienta Principal *'}
                placeholder="Buscar herramienta..."
                options={mainHerramientaOptions}
                value={formData.herramientaId}
                onSelect={(val: number) => {
                  const found = herramientas.find(h => h.id === val);
                  if (found && isDevolucionType && found.propietarioId) {
                    setFormData((p: any) => ({ ...p, herramientaId: found.id, userId: found.propietarioId }));
                  } else {
                    setFormData((p: any) => ({ ...p, herramientaId: val }));
                  }
                }}
              />
 
              {formData.tipo === 'cambio' && (
                <SearchableSelect
                  label="Herramienta Anterior (a Devolver) *"
                  placeholder="Buscar herramienta asignada..."
                  options={secondaryHerramientaOptions}
                  value={formData.secondaryHerramientaId}
                  onSelect={(val: number) => set('secondaryHerramientaId', val)}
                />
              )}
 
              <SearchableSelect
                label="Empleado Involucrado *"
                placeholder="Buscar por nombre o cédula..."
                options={userOptions}
                value={formData.userId}
                onSelect={(val: string) => set('userId', val)}
                disabled={isDevolucionType && !!formData.herramientaId}
              />
 
              <div className="input-group">
                <label className="input-label">Condición al Entregar</label>
                <select className="input-field" value={formData.condicionEntrega} onChange={e => set('condicionEntrega', e.target.value)}>
                  {CONDICIONES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
 
              {formData.tipo === 'cambio' && (
                <div className="input-group">
                  <label className="input-label">Condición de la Herramienta Devuelta</label>
                  <select className="input-field" value={formData.condicionRecepcion} onChange={e => set('condicionRecepcion', e.target.value)}>
                    {CONDICIONES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              )}
 
              {formData.tipo === 'prestamo' && (
                <div className="input-group">
                  <label className="input-label"><Clock size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Fecha de Retorno Prevista</label>
                  <input type="date" className="input-field" value={formData.fechaRetornoPrevista} onChange={e => set('fechaRetornoPrevista', e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
              )}
 
              <div className="input-group">
                <label className="input-label">Fecha del Movimiento</label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.fecha}
                  onChange={e => set('fecha', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
 
              <div className="input-group span-2">
                <label className="input-label">Notas del Movimiento</label>
                <textarea className="input-field" rows={2} value={formData.notas} onChange={e => set('notas', e.target.value)} placeholder="Motivo del movimiento, observaciones, etc." />
              </div>
            </div>
 
            <div style={{ marginTop: 4, display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Save size={16} /> {submitting ? 'Guardando...' : 'Guardar y Generar Acta PDF'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
 
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="input-field" placeholder="Filtrar por cédula de empleado..." style={{ paddingLeft: 34 }} value={filterCedula} onChange={e => setFilterCedula(e.target.value)} />
        </div>
        <select className="input-field" style={{ maxWidth: 200 }} value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TIPOS_MOVIMIENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', alignSelf: 'center' }}>
          {filteredMovements.length} de {movements.length} movimientos
        </p>
      </div>
 
      <div className="section-card" style={{ overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Herramienta</th>
              <th>Empleado</th>
              <th>Condición</th>
              <th>Notas</th>
              <th>Acta</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.length === 0
              ? <tr><td colSpan={8}><div className="empty-state"><p>No se encontraron movimientos.</p></div></td></tr>
              : filteredMovements.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{m.id}</td>
                  <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    <div>{new Date(m.fecha).toLocaleDateString('es-CO')}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{new Date(m.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td><span className={`badge badge-${m.tipo}`}>{MOVIMIENTO_LABELS[m.tipo] || m.tipo}</span></td>
                  <td style={{ fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 500 }}>{m.herramienta?.identificador || m.herramienta?.nombre || `#${m.herramientaId}`}</div>
                    {m.secondaryHerramienta && <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>↔ {m.secondaryHerramienta.identificador || m.secondaryHerramienta.nombre}</div>}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 500 }}>{m.user?.nombre || m.userId}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>C.C. {m.userId}</div>
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>
                    {m.condicionEntrega && <span className="badge badge-activo">{m.condicionEntrega}</span>}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 160 }}>
                    <span title={m.notas || ''} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.notas || '—'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => generatePDF(m)}>
                      <Printer size={14} /> Acta PDF
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};
 
export default HerramientaMovements;