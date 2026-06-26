import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { Plus, Printer, Search, X, Save, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TIPOS_MOVIMIENTO = [
  { value: 'asignacion', label: 'Asignación', desc: 'Entregar un equipo disponible a un empleado' },
  { value: 'devolucion', label: 'Devolución', desc: 'Devolver un equipo asignado al inventario' },
  { value: 'cambio', label: 'Cambio', desc: 'Reemplazar un equipo por otro (devolución + asignación simultánea)' },
  { value: 'prestamo', label: 'Préstamo', desc: 'Entregar temporalmente un equipo a un empleado' },
  { value: 'retorno_prestamo', label: 'Retorno Préstamo', desc: 'Devolver un equipo prestado al inventario' },
];

const MOVIMIENTO_LABELS: Record<string, string> = Object.fromEntries(TIPOS_MOVIMIENTO.map(t => [t.value, t.label]));

const CONDICIONES = ['bueno', 'regular', 'dañado'];

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image(); img.src = url;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });

// Searchable select component
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

const Movements: React.FC = () => {
  const { sessionUser } = useAuth();
  const [movements, setMovements] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [filterCedula, setFilterCedula] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({
    assetId: 0,
    secondaryAssetId: 0,
    userId: '',
    tipo: 'asignacion',
    condicionEntrega: 'bueno',
    condicionRecepcion: 'bueno',
    fechaRetornoPrevista: '',
    notas: '',
  });

  const fetchData = async () => {
    const [m, a, u] = await Promise.all([api.getMovements(), api.getAssets(), api.getUsers()]);
    setMovements(m); setAssets(a); setUsers(u);
  };
  useEffect(() => { fetchData(); }, []);

  const set = (field: string, value: any) => setFormData((p: any) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetId || !formData.userId) return;
    if (formData.tipo === 'cambio' && !formData.secondaryAssetId) {
      alert('Para un cambio debes seleccionar el equipo anterior a devolver.');
      return;
    }
    setSubmitting(true);
    try {
      const registradoPorId = sessionUser?.cedula || '00000000';
      const newMovement = { ...formData, registradoPorId, fecha: new Date().toISOString() };
      const result = await api.addMovement(newMovement);

      // ── Actualizar activos automáticamente ──
      const asset = assets.find(a => a.id === formData.assetId);
      const assignedUser = users.find(u => String(u.id) === String(formData.userId));

      if (asset) {
        // Solo enviamos los campos de logística que cambian en un movimiento.
        // Nunca tocamos imei, phoneLineId, printerDetail, etc. para no perder esa info.
        const baseUpdate = {
          codigo: asset.codigo,
          identificador: asset.identificador,
          tipo: asset.tipo,
          subTipo: asset.subTipo,
          marca: asset.marca,
          modelo: asset.modelo,
          procesador: asset.procesador,
          condicion: formData.condicionEntrega || asset.condicion,
          estado: asset.estado,
          disponibilidad: asset.disponibilidad,
          ubicacion: asset.ubicacion,
          departamentoId: asset.departamentoId,
          propietarioId: asset.propietarioId,
          fechaAdquisicion: asset.fechaAdquisicion,
          valorAdquisicion: asset.valorAdquisicion,
          notas: asset.notas,
          detallesAdicionales: asset.detallesAdicionales,
          // Preservar detalles específicos según tipo
          ...(asset.tipo === 'celular' && asset.cellphoneDetail ? {
            imei: asset.cellphoneDetail.imei,
            imei2: asset.cellphoneDetail.imei2,
            phoneLineId: asset.cellphoneDetail.phoneLineId,
          } : {}),
          ...(asset.tipo === 'impresora' && asset.printerDetail ? {
            referenciaEquipo: asset.printerDetail.referenciaEquipo,
            precioToner: asset.printerDetail.precioToner,
            costoPromImpresion: asset.printerDetail.costoPromImpresion,
            tipoImpresion: asset.printerDetail.tipoImpresion,
          } : {}),
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
        await api.updateAsset(asset.id, baseUpdate);
      }

      // En cambio: devolver el equipo anterior
      if (formData.tipo === 'cambio' && formData.secondaryAssetId) {
        const oldAsset = assets.find(a => a.id === formData.secondaryAssetId);
        if (oldAsset) {
          const oldBaseUpdate = {
            codigo: oldAsset.codigo,
            identificador: oldAsset.identificador,
            tipo: oldAsset.tipo,
            subTipo: oldAsset.subTipo,
            marca: oldAsset.marca,
            modelo: oldAsset.modelo,
            procesador: oldAsset.procesador,
            condicion: formData.condicionRecepcion || oldAsset.condicion,
            estado: oldAsset.estado,
            disponibilidad: 'disponible',
            ubicacion: 'Bodega Compras',
            departamentoId: oldAsset.departamentoId,
            propietarioId: null,
            fechaAdquisicion: oldAsset.fechaAdquisicion,
            valorAdquisicion: oldAsset.valorAdquisicion,
            notas: oldAsset.notas,
            detallesAdicionales: oldAsset.detallesAdicionales,
            // Preservar detalles específicos según tipo
            ...(oldAsset.tipo === 'celular' && oldAsset.cellphoneDetail ? {
              imei: oldAsset.cellphoneDetail.imei,
              imei2: oldAsset.cellphoneDetail.imei2,
              phoneLineId: oldAsset.cellphoneDetail.phoneLineId,
            } : {}),
            ...(oldAsset.tipo === 'impresora' && oldAsset.printerDetail ? {
              referenciaEquipo: oldAsset.printerDetail.referenciaEquipo,
              precioToner: oldAsset.printerDetail.precioToner,
              costoPromImpresion: oldAsset.printerDetail.costoPromImpresion,
              tipoImpresion: oldAsset.printerDetail.tipoImpresion,
            } : {}),
          };
          await api.updateAsset(oldAsset.id, oldBaseUpdate);
        }
      }

      setShowForm(false);
      setFormData({ assetId: 0, secondaryAssetId: 0, userId: '', tipo: 'asignacion', condicionEntrega: 'bueno', condicionRecepcion: 'bueno', fechaRetornoPrevista: '', notas: '' });
      await fetchData();

      // Generar PDF
      generatePDF({ ...newMovement, id: result?.id || Math.random() });
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally { setSubmitting(false); }
  };

  const generatePDF = async (movement: any) => {
    const asset = assets.find(a => a.id === movement.assetId);
    const secondaryAsset = assets.find(a => a.id === movement.secondaryAssetId);
    const user = users.find(u => String(u.id) === String(movement.userId));
    const registrador = users.find(u => String(u.id) === String(movement.registradoPorId));

    // Cargar membrete completo
    let membreteImg: HTMLImageElement | null = null;
    try { membreteImg = await loadImage('/membretegj.png'); } catch { }

    // Helper: dibuja el membrete como fondo de página completa (A4 = 210×297 mm)
    const drawMembrete = () => {
      if (membreteImg) {
        doc.addImage(membreteImg, 'PNG', 0, 0, 210, 297);
      }
    };

    const doc = new jsPDF();

    // Dibujar membrete en la página 1 ANTES del contenido
    drawMembrete();

    const fechaFormat = new Date(movement.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const tipoLabel = MOVIMIENTO_LABELS[movement.tipo] || movement.tipo;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(`Santiago de Cali, ${fechaFormat}`, 14, 48);
    doc.text('Cordial saludo.', 14, 56);
    doc.text(`Mediante el presente documento se registra ${tipoLabel.toUpperCase()} de equipo con los siguientes detalles:`, 14, 64);

    // Callback que redibuja el membrete cada vez que autoTable añade una nueva página
    const didAddPage = () => { drawMembrete(); };

    // Asset details table
    autoTable(doc, {
      startY: 70,
      head: [[movement.tipo === 'cambio' ? 'Equipo a Entregar' : `Equipo — ${tipoLabel}`, 'Información']],
      body: [
        ['Identificador', asset?.identificador || '—'],
        ['Tipo / Marca / Modelo', `${asset?.tipo?.toUpperCase() || '?'} — ${asset?.marca} ${asset?.modelo}`],
        ...(asset?.procesador ? [['Procesador', asset.procesador]] : []),
        ['Serial / Código', asset?.codigo || '—'],
        ['Condición de Entrega', movement.condicionEntrega || '—'],
        ['Detalles Adicionales', asset?.detallesAdicionales || 'Ninguno'],
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

    // Secondary asset table (cambio)
    if (movement.tipo === 'cambio' && secondaryAsset) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 8,
        head: [['Equipo a Devolver', 'Información']],
        body: [
          ['Identificador', secondaryAsset.identificador || '—'],
          ['Tipo / Marca / Modelo', `${secondaryAsset.tipo?.toUpperCase() || '?'} — ${secondaryAsset.marca} ${secondaryAsset.modelo}`],
          ['Serial / Código', secondaryAsset.codigo || '—'],
          ['Condición de Recepción', movement.condicionRecepcion || '—'],
        ],
        theme: 'grid',
        headStyles: { fillColor: false, textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
        didDrawPage: didAddPage,
      });
    }

    // Condiciones text
    let currentY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const condicionesText = "Condiciones de Uso: El presente equipo es una herramienta de trabajo proporcionada exclusivamente para el desempeño de sus labores en la empresa. El empleado se compromete a darle un uso adecuado, velar por su cuidado y seguridad. Asimismo, se compromete a reportar de manera inmediata cualquier fallo, daño, pérdida o robo. En caso de comprobarse que el equipo sufrió daños, pérdida o afectación por negligencia, descuido o mal uso, el empleado asumirá la responsabilidad y/o los costos correspondientes de reparación o reposición.";
    const splitCondiciones = doc.splitTextToSize(condicionesText, 182);

    if (currentY + (splitCondiciones.length * 4) + 40 > 270) {
      doc.addPage();
      drawMembrete();
      currentY = 20;
    }

    doc.text(splitCondiciones, 14, currentY);

    // Signatures
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

    doc.save(`Acta_${tipoLabel}_${user?.id || movement.userId}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const filteredMovements = useMemo(() => movements.filter(m => {
    const matchCedula = !filterCedula || String(m.userId).includes(filterCedula) || String(m.registradoPorId).includes(filterCedula);
    const matchTipo = !filterTipo || m.tipo === filterTipo;
    return matchCedula && matchTipo;
  }), [movements, filterCedula, filterTipo]);

  // Asset options per movement type
  const mainAssetOptions = useMemo(() => assets.filter(a => {
    if (formData.tipo === 'asignacion') return a.disponibilidad === 'disponible';
    if (formData.tipo === 'devolucion') return a.disponibilidad === 'asignado';
    if (formData.tipo === 'cambio') return a.disponibilidad === 'disponible';
    if (formData.tipo === 'prestamo') return a.disponibilidad === 'disponible';
    if (formData.tipo === 'retorno_prestamo') return a.disponibilidad === 'prestado';
    return true;
  }).map(a => ({ value: a.id, label: `${a.identificador || a.codigo} | ${a.tipo} ${a.marca} ${a.modelo}` })), [assets, formData.tipo]);

  const secondaryAssetOptions = useMemo(() =>
    assets.filter(a => a.disponibilidad === 'asignado')
      .map(a => ({ value: a.id, label: `${a.identificador || a.codigo} | ${a.tipo} ${a.marca} ${a.modelo}` })),
    [assets]);

  const userOptions = useMemo(() =>
    users.map(u => ({ value: u.id, label: `${u.nombre} — C.C. ${u.id}` })),
    [users]);

  const currentTipoInfo = TIPOS_MOVIMIENTO.find(t => t.value === formData.tipo);
  const isDevolucionType = ['devolucion', 'retorno_prestamo'].includes(formData.tipo);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Movimientos & Actas</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            {movements.length} movimientos registrados — Trazabilidad completa de activos
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Registrar Movimiento</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="form-panel">
          <h2>Nuevo Registro de Movimiento</h2>

          {/* Tipo selector cards */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {TIPOS_MOVIMIENTO.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setFormData({ assetId: 0, secondaryAssetId: 0, userId: '', tipo: t.value, condicionEntrega: 'bueno', condicionRecepcion: 'bueno', fechaRetornoPrevista: '', notas: '' })}
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
                label={formData.tipo === 'cambio' ? 'Equipo Nuevo (a Entregar)' : 'Activo Principal *'}
                placeholder="Buscar equipo..."
                options={mainAssetOptions}
                value={formData.assetId}
                onSelect={(val: number) => {
                  const found = assets.find(a => a.id === val);
                  if (found && isDevolucionType && found.propietarioId) {
                    setFormData((p: any) => ({ ...p, assetId: found.id, userId: found.propietarioId }));
                  } else {
                    setFormData((p: any) => ({ ...p, assetId: val }));
                  }
                }}
              />

              {formData.tipo === 'cambio' && (
                <SearchableSelect
                  label="Equipo Anterior (a Devolver) *"
                  placeholder="Buscar equipo asignado..."
                  options={secondaryAssetOptions}
                  value={formData.secondaryAssetId}
                  onSelect={(val: number) => set('secondaryAssetId', val)}
                />
              )}

              <SearchableSelect
                label="Empleado Involucrado *"
                placeholder="Buscar por nombre o cédula..."
                options={userOptions}
                value={formData.userId}
                onSelect={(val: string) => set('userId', val)}
                disabled={isDevolucionType && !!formData.assetId}
              />

              <div className="input-group">
                <label className="input-label">Condición al Entregar</label>
                <select className="input-field" value={formData.condicionEntrega} onChange={e => set('condicionEntrega', e.target.value)}>
                  {CONDICIONES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>

              {formData.tipo === 'cambio' && (
                <div className="input-group">
                  <label className="input-label">Condición del Equipo Devuelto</label>
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

      {/* Filters */}
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

      {/* Table */}
      <div className="section-card" style={{ overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Equipo</th>
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
                    <div style={{ fontWeight: 500 }}>{m.asset?.identificador || m.asset?.codigo || `#${m.assetId}`}</div>
                    {m.secondaryAsset && <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>↔ {m.secondaryAsset.identificador || m.secondaryAsset.codigo}</div>}
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

export default Movements;
