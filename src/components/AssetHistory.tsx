import React, { useEffect, useState } from 'react';
import { X, Package, User, Clock, ArrowRight } from 'lucide-react';
import { api } from '../api';

interface AssetHistoryProps {
  asset: any;
  onClose: () => void;
}

const TIPO_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  asignacion:       { bg: 'rgba(49,130,206,0.12)',  color: '#2b6cb0', label: 'Asignación' },
  devolucion:       { bg: 'rgba(14,164,114,0.12)',  color: '#0e7f5b', label: 'Devolución' },
  cambio:           { bg: 'rgba(245,158,11,0.12)',  color: '#b45309', label: 'Cambio' },
  prestamo:         { bg: 'rgba(124,58,237,0.12)',  color: '#6d28d9', label: 'Préstamo' },
  retorno_prestamo: { bg: 'rgba(8,145,178,0.12)',   color: '#0e7490', label: 'Retorno Préstamo' },
};

const AssetHistory: React.FC<AssetHistoryProps> = ({ asset, onClose }) => {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMovements({ assetId: asset.id })
      .then(setMovements)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [asset.id]);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'var(--primary-subtle)', color: 'var(--primary-main)', padding: 10, borderRadius: 10 }}>
              <Package size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Historial de Movimientos</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                {asset.identificador || asset.codigo} · {asset.tipo} {asset.marca} {asset.modelo}
              </p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
              <div className="animate-spin" style={{ width: 24, height: 24, border: '3px solid #e4ecf5', borderTopColor: 'var(--primary-main)', borderRadius: '50%', margin: '0 auto 8px' }} />
              Cargando historial...
            </div>
          ) : movements.length === 0 ? (
            <div className="empty-state">
              <Clock size={36} />
              <p>Este equipo no tiene movimientos registrados.</p>
            </div>
          ) : (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
                {movements.length} movimiento{movements.length !== 1 ? 's' : ''} registrado{movements.length !== 1 ? 's' : ''}
              </p>
              <div className="timeline">
                {movements.map((m, idx) => {
                  const cfg = TIPO_COLORS[m.tipo] || { bg: '#f1f5f9', color: '#64748b', label: m.tipo };
                  return (
                    <div key={m.id} className="timeline-item">
                      <div className="timeline-line">
                        <div className="timeline-dot" style={{ background: cfg.bg, color: cfg.color }}>
                          {m.id}
                        </div>
                        {idx < movements.length - 1 && <div className="timeline-connector" />}
                      </div>
                      <div className="timeline-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <span className={`badge badge-${m.tipo}`}>{cfg.label}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {new Date(m.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.82rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <User size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <span>
                              <strong>{m.user?.nombre || m.userId}</strong>
                              {m.user?.cargo && <span style={{ color: 'var(--text-muted)' }}> · {m.user.cargo}</span>}
                              <span style={{ color: 'var(--text-muted)' }}> (C.C. {m.userId})</span>
                            </span>
                          </div>

                          {m.secondaryAsset && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                              <ArrowRight size={13} style={{ flexShrink: 0 }} />
                              <span>Equipo secundario: {m.secondaryAsset.identificador || m.secondaryAsset.codigo}</span>
                            </div>
                          )}

                          {m.condicionEntrega && (
                            <div style={{ color: 'var(--text-secondary)' }}>
                              Condición entrega: <strong>{m.condicionEntrega}</strong>
                              {m.condicionRecepcion && <> → recepción: <strong>{m.condicionRecepcion}</strong></>}
                            </div>
                          )}

                          {m.fechaRetornoPrevista && (
                            <div style={{ color: '#7c3aed', fontWeight: 500 }}>
                              <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                              Retorno previsto: {new Date(m.fechaRetornoPrevista).toLocaleDateString('es-CO')}
                            </div>
                          )}

                          {m.notas && (
                            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>
                              "{m.notas}"
                            </div>
                          )}

                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>
                            Registrado por: {m.registradoPor?.nombre || m.registradoPorId}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetHistory;
