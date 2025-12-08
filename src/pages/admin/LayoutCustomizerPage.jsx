import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import './LayoutCustomizerPage.css';

const LAYOUT_STORAGE_KEY = 'hs_custom_layout';

const defaultBlocks = [
  { id: 'hero', name: 'Hero Section', type: 'hero', enabled: true, order: 0, size: 'large', x: 0, y: 0, width: 100, alignment: 'center' },
  { id: 'countdown', name: 'Countdown Timer', type: 'countdown', enabled: true, order: 1, size: 'medium', x: 0, y: 1, width: 100, alignment: 'center' },
  { id: 'details', name: 'Event Details', type: 'details', enabled: true, order: 2, size: 'large', x: 0, y: 2, width: 100, alignment: 'left' },
  { id: 'rsvp', name: 'RSVP Section', type: 'rsvp', enabled: true, order: 3, size: 'medium', x: 0, y: 3, width: 50, alignment: 'left' },
  { id: 'memory-wall', name: 'Memory Wall', type: 'memory', enabled: true, order: 4, size: 'large', x: 0, y: 4, width: 100, alignment: 'center' },
  { id: 'games', name: 'Games & Guesses', type: 'games', enabled: true, order: 5, size: 'medium', x: 0, y: 5, width: 50, alignment: 'left' },
];

const LayoutCustomizerPage = () => {
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState(() => {
    try {
      const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : defaultBlocks;
    } catch {
      return defaultBlocks;
    }
  });
  const [draggedBlock, setDraggedBlock] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  const saveLayout = () => {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(blocks));
      alert('Layout saved successfully!');
    } catch (err) {
      alert('Failed to save layout');
    }
  };

  const resetLayout = () => {
    if (confirm('Reset to default layout?')) {
      setBlocks(defaultBlocks);
      localStorage.removeItem(LAYOUT_STORAGE_KEY);
    }
  };

  const handleDragStart = (e, block) => {
    setDraggedBlock(block);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetBlock) => {
    e.preventDefault();
    if (!draggedBlock || draggedBlock.id === targetBlock.id) return;

    const draggedIndex = blocks.findIndex(b => b.id === draggedBlock.id);
    const targetIndex = blocks.findIndex(b => b.id === targetBlock.id);

    const newBlocks = [...blocks];
    const [removed] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, removed);

    // Update order values
    const reordered = newBlocks.map((b, idx) => ({ ...b, order: idx }));
    setBlocks(reordered);
    setDraggedBlock(null);
  };

  const toggleBlock = (id) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b));
  };

  const resizeBlock = (id, size) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, size } : b));
  };

  const updateBlockWidth = (id, width) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, width: Math.max(25, Math.min(100, width)) } : b));
  };

  const updateBlockAlignment = (id, alignment) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, alignment } : b));
  };

  const moveBlockUp = (id) => {
    const index = blocks.findIndex(b => b.id === id);
    if (index > 0) {
      const newBlocks = [...blocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      const reordered = newBlocks.map((b, idx) => ({ ...b, order: idx }));
      setBlocks(reordered);
    }
  };

  const moveBlockDown = (id) => {
    const index = blocks.findIndex(b => b.id === id);
    if (index < blocks.length - 1) {
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      const reordered = newBlocks.map((b, idx) => ({ ...b, order: idx }));
      setBlocks(reordered);
    }
  };

  const renderBlockPreview = (block) => {
    const sizeClass = `preview-block--${block.size}`;
    const widthStyle = { width: `${block.width}%` };
    const alignmentClass = `align-${block.alignment}`;
    
    return (
      <div
        key={block.id}
        className={`preview-block ${sizeClass} ${alignmentClass} ${!block.enabled ? 'preview-block--disabled' : ''}`}
        style={widthStyle}
        draggable={!previewMode}
        onDragStart={(e) => handleDragStart(e, block)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, block)}
      >
        <div className="preview-block-header">
          <span className="block-name">{block.name}</span>
          <span className="block-type">{block.type}</span>
        </div>
        <div className="preview-block-content">
          {getBlockPreviewContent(block.type)}
        </div>
        {!previewMode && (
          <div className="preview-block-controls">
            <div className="control-group">
              <button onClick={() => toggleBlock(block.id)} className="control-btn">
                {block.enabled ? '👁️ Hide' : '👁️‍🗨️ Show'}
              </button>
              <select 
                value={block.size} 
                onChange={(e) => resizeBlock(block.id, e.target.value)}
                className="size-selector"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div className="control-group">
              <label className="control-label">Width:</label>
              <input 
                type="range" 
                min="25" 
                max="100" 
                step="5" 
                value={block.width}
                onChange={(e) => updateBlockWidth(block.id, parseInt(e.target.value))}
                className="width-slider"
              />
              <span className="width-value">{block.width}%</span>
            </div>
            <div className="control-group">
              <label className="control-label">Align:</label>
              <div className="align-buttons">
                <button 
                  className={`align-btn ${block.alignment === 'left' ? 'active' : ''}`}
                  onClick={() => updateBlockAlignment(block.id, 'left')}
                  title="Align Left"
                >⬅️</button>
                <button 
                  className={`align-btn ${block.alignment === 'center' ? 'active' : ''}`}
                  onClick={() => updateBlockAlignment(block.id, 'center')}
                  title="Align Center"
                >↔️</button>
                <button 
                  className={`align-btn ${block.alignment === 'right' ? 'active' : ''}`}
                  onClick={() => updateBlockAlignment(block.id, 'right')}
                  title="Align Right"
                >➡️</button>
              </div>
            </div>
            <div className="control-group">
              <button onClick={() => moveBlockUp(block.id)} className="control-btn-sm" disabled={block.order === 0}>⬆️</button>
              <button onClick={() => moveBlockDown(block.id)} className="control-btn-sm" disabled={block.order === blocks.length - 1}>⬇️</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getBlockPreviewContent = (type) => {
    switch (type) {
      case 'hero':
        return <div className="mock-content hero-mock">👰🤵 Wedding Invitation Hero</div>;
      case 'countdown':
        return <div className="mock-content">⏰ 00:00:00:00</div>;
      case 'details':
        return <div className="mock-content">📅 Event Details & Location</div>;
      case 'rsvp':
        return <div className="mock-content">✉️ RSVP Form</div>;
      case 'memory':
        return <div className="mock-content">📸 Memory Wall Gallery</div>;
      case 'games':
        return <div className="mock-content">🎮 Games & Guesses</div>;
      default:
        return <div className="mock-content">Content Block</div>;
    }
  };

  return (
    <div className="layout-customizer-shell">
      <div className="layout-customizer-container">
        <header className="customizer-header">
          <div>
            <p className="eyebrow">Layout Manager</p>
            <h1 className="page-title">Page Layout Customizer</h1>
            <p className="page-subtitle">Drag blocks to reorder, resize, and toggle visibility</p>
          </div>
          <div className="header-actions">
            <Button variant="ghost" onClick={() => navigate('/admin')}>Back to Admin</Button>
            <Button variant="outline" onClick={resetLayout}>Reset</Button>
            <Button variant="primary" onClick={saveLayout}>💾 Save Layout</Button>
          </div>
        </header>

        <div className="customizer-toolbar">
          <button 
            className={`toolbar-btn ${!previewMode ? 'active' : ''}`}
            onClick={() => setPreviewMode(false)}
          >
            ✏️ Edit Mode
          </button>
          <button 
            className={`toolbar-btn ${previewMode ? 'active' : ''}`}
            onClick={() => setPreviewMode(true)}
          >
            👁️ Preview Mode
          </button>
        </div>

        <div className="customizer-workspace">
          <aside className="customizer-sidebar">
            <h3>Block Settings</h3>
            <div className="sidebar-info">
              <p>📌 <strong>Drag & Drop</strong> blocks to reorder</p>
              <p>👁️ Toggle visibility on/off</p>
              <p>📏 Resize blocks (Small/Medium/Large)</p>
              <p>📐 Adjust width & alignment</p>
              <p>⬆️⬇️ Move blocks up/down</p>
              <p>💾 Save changes when done</p>
            </div>
            <div className="block-list">
              <h4>Available Blocks</h4>
              {blocks.map(block => (
                <div key={block.id} className="block-item">
                  <span className={block.enabled ? 'status-on' : 'status-off'}>
                    {block.enabled ? '✓' : '○'}
                  </span>
                  <span>{block.name}</span>
                  <span className="block-size-label">{block.size}</span>
                </div>
              ))}
            </div>
          </aside>

          <div className="customizer-canvas">
            <div className="canvas-header">
              <h3>Page Preview</h3>
              <span className="canvas-hint">
                {previewMode ? '🔒 Preview locked' : '✋ Drag blocks to reorder'}
              </span>
            </div>
            <div className="preview-container">
              {blocks.filter(b => b.enabled).map(renderBlockPreview)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutCustomizerPage;
