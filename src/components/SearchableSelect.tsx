import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchableSelect: React.FC<Props> = ({ options, value, onChange, placeholder = 'Seleccionar...', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }} className={className}>
      <div 
        className="input-field" 
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', backgroundColor: 'var(--bg-card)' }}
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: selectedOption ? 'inherit' : 'var(--text-muted)' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, 
          background: 'var(--bg-card)', border: '1px solid var(--border-color)', 
          borderRadius: 8, marginTop: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          maxHeight: 250, display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: 8, borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              autoFocus
              className="input-field" 
              style={{ paddingLeft: 30, height: 32, width: '100%' }}
              placeholder="Buscar..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.9rem' }}
              onClick={() => { onChange(''); setIsOpen(false); }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Sin línea asignada
            </div>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>No hay resultados</div>
            ) : (
              filteredOptions.map(option => (
                <div 
                  key={option.value}
                  style={{
                    padding: '8px 12px', cursor: 'pointer', fontSize: '0.9rem',
                    background: option.value === value ? 'rgba(0, 119, 255, 0.1)' : 'transparent',
                    color: option.value === value ? 'var(--primary-dark)' : 'inherit',
                  }}
                  onClick={() => { onChange(option.value); setIsOpen(false); }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = option.value === value ? 'rgba(0, 119, 255, 0.1)' : 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = option.value === value ? 'rgba(0, 119, 255, 0.1)' : 'transparent')}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
