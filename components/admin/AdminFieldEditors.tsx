'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { BlogData } from '@/lib/blog';
import type { FieldConfig, JsonRecord, PathSegment, UploadImage } from '@/components/admin/adminTypes';
import {
  asRecordArray,
  getAtPath,
  numberInputValue,
  parseNumberInput,
  stringValue,
  toTextLines
} from '@/components/admin/adminUtils';

export function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="admin-field-grid">{children}</div>;
}

export function PathField({ data, field, path, onChange, uploadImage }: {
  data: BlogData;
  field: FieldConfig;
  path: PathSegment[];
  onChange: (path: PathSegment[], value: unknown) => void;
  uploadImage: UploadImage;
}) {
  return <FieldEditor field={field} value={getAtPath(data, path)} onChange={(nextValue) => onChange(path, nextValue)} uploadImage={uploadImage} />;
}

export function FieldEditor({ field, value, onChange, uploadImage }: {
  field: FieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  uploadImage: UploadImage;
}) {
  const kind = field.kind ?? 'text';

  if (kind === 'boolean') {
    return (
      <label className="admin-field admin-field-toggle">
        <span>{field.label}</span>
        <input checked={Boolean(value)} type="checkbox" onChange={(event) => onChange(event.target.checked)} />
        <FieldHelp text={field.help} />
      </label>
    );
  }

  if (kind === 'list') {
    return <StringListEditor label={field.label} value={value} onChange={onChange} />;
  }

  if (kind === 'image') {
    return <ImageUploadField label={field.label} value={value} onChange={onChange} uploadImage={uploadImage} cropAspect={field.cropAspect} />;
  }

  if (kind === 'image-list') {
    return <ImageListEditor label={field.label} value={value} onChange={onChange} uploadImage={uploadImage} cropAspect={field.cropAspect} />;
  }

  if (kind === 'image-items') {
    return <GalleryItemsEditor label={field.label} value={value} onChange={onChange} uploadImage={uploadImage} cropAspect={field.cropAspect} />;
  }

  if (kind === 'select') {
    return (
      <label className="admin-field">
        <span>{field.label}</span>
        <select value={stringValue(value)} onChange={(event) => onChange(event.target.value)}>
          {(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <FieldHelp text={field.help} />
      </label>
    );
  }

  if (kind === 'prose') {
    return (
      <label className="admin-field admin-field-wide admin-prose-editor">
        <span>{field.label}</span>
        <PlainTextEditor rows={field.rows ?? 8} value={value} onChange={onChange} />
        <FieldHelp text={field.help} />
      </label>
    );
  }

  if (kind === 'textarea') {
    return (
      <label className="admin-field admin-field-wide">
        <span>{field.label}</span>
        <textarea placeholder={field.placeholder} rows={field.rows ?? 4} value={stringValue(value)} onChange={(event) => onChange(event.target.value)} />
        <FieldHelp text={field.help} />
      </label>
    );
  }

  return (
    <label className="admin-field">
      <span>{field.label}</span>
      <input
        type={kind === 'number' ? 'number' : kind === 'date' ? 'date' : 'text'}
        placeholder={field.placeholder}
        value={kind === 'number' ? numberInputValue(value) : stringValue(value)}
        onChange={(event) => onChange(kind === 'number' ? parseNumberInput(event.target.value) : event.target.value)}
      />
      <FieldHelp text={field.help} fallback={field.advanced ? '这个设置一般不用改。' : ''} />
    </label>
  );
}

export function PlainTextEditor({ value, rows, onChange }: { value: unknown; rows: number; onChange: (value: string) => void }) {
  return (
    <textarea
      rows={rows}
      spellCheck
      value={plainTextFromStoredContent(value)}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function StringListEditor({ label, value, onChange }: { label: string; value: unknown; onChange: (value: string[]) => void }) {
  const list = toTextLines(value);
  return (
    <label className="admin-field admin-field-wide">
      <span>{label}</span>
      <textarea
        rows={Math.max(3, Math.min(8, list.length + 1))}
        value={list.join('\n')}
        onChange={(event) => onChange(event.target.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean))}
      />
    </label>
  );
}

type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PendingCrop = {
  file: File;
  sourceUrl: string;
  imageWidth: number;
  imageHeight: number;
  cropAspect?: number;
  area: CropArea;
};

type ImageUploadFlow = {
  preview: string;
  pendingCrop: PendingCrop | null;
  handleFile: (event: ChangeEvent<HTMLInputElement>) => void;
  confirmCrop: (area: CropArea) => Promise<void>;
  keepOriginal: () => Promise<void>;
  cancelCrop: () => void;
};

function useImageUploadFlow(uploadImage: UploadImage, onUploaded: (path: string, previewUrl: string) => void, cropAspect?: number): ImageUploadFlow {
  const [preview, setPreview] = useState('');
  const [pendingCrop, setPendingCrop] = useState<PendingCrop | null>(null);
  const previewRef = useRef('');

  const setPreviewUrl = (nextUrl: string) => {
    const previous = previewRef.current;
    if (previous && previous !== nextUrl) {
      URL.revokeObjectURL(previous);
    }
    previewRef.current = nextUrl;
    setPreview(nextUrl);
  };

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  const uploadAndPreview = async (file: File, previewUrl?: string) => {
    const nextPreviewUrl = previewUrl ?? URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);
    const savedPath = await uploadImage(file);
    onUploaded(savedPath, nextPreviewUrl);
  };

  const uploadCroppedFile = async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setPreviewUrl(previewUrl);
    const savedPath = await uploadImage(file);
    onUploaded(savedPath, previewUrl);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    const sourceUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const cropSize = createInitialCropArea(image.naturalWidth, image.naturalHeight, cropAspect);
      setPendingCrop((current) => {
        if (current?.sourceUrl) {
          URL.revokeObjectURL(current.sourceUrl);
        }
        return {
          file,
          sourceUrl,
          imageWidth: image.naturalWidth,
          imageHeight: image.naturalHeight,
          cropAspect,
          area: cropSize
        };
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
    };
    image.src = sourceUrl;
  };

  const clearPendingCrop = () => {
    setPendingCrop((current) => {
      if (current?.sourceUrl) {
        URL.revokeObjectURL(current.sourceUrl);
      }
      return null;
    });
  };

  const confirmCrop = async (area: CropArea) => {
    if (!pendingCrop) {
      return;
    }
    const croppedFile = await cropImageFile(pendingCrop.file, pendingCrop.sourceUrl, area, pendingCrop.cropAspect);
    const sourceUrl = pendingCrop.sourceUrl;
    setPendingCrop(null);
    URL.revokeObjectURL(sourceUrl);
    await uploadCroppedFile(croppedFile);
  };

  const keepOriginal = async () => {
    if (!pendingCrop) {
      return;
    }
    const sourceUrl = pendingCrop.sourceUrl;
    const file = pendingCrop.file;
    setPendingCrop(null);
    await uploadAndPreview(file, sourceUrl);
  };

  return {
    preview,
    pendingCrop,
    handleFile,
    confirmCrop,
    keepOriginal,
    cancelCrop: clearPendingCrop
  };
}

function createInitialCropArea(imageWidth: number, imageHeight: number, cropAspect?: number): CropArea {
  if (cropAspect) {
    return createAspectCropArea(imageWidth, imageHeight, cropAspect, 0.82);
  }

  const width = Math.max(1, Math.round(imageWidth * 0.82));
  const height = Math.max(1, Math.round(imageHeight * 0.82));
  return {
    x: Math.round((imageWidth - width) / 2),
    y: Math.round((imageHeight - height) / 2),
    width,
    height
  };
}

function createAspectCropArea(imageWidth: number, imageHeight: number, cropAspect: number, scale = 1): CropArea {
  const safeAspect = Math.max(0.01, cropAspect);
  const maxWidth = Math.min(imageWidth, imageHeight * safeAspect);
  const maxHeight = maxWidth / safeAspect;
  const width = Math.max(1, Math.round(maxWidth * scale));
  const height = Math.max(1, Math.round(width / safeAspect));

  return {
    x: Math.round((imageWidth - width) / 2),
    y: Math.round((imageHeight - height) / 2),
    width,
    height
  };
}

function clampCropArea(area: CropArea, imageWidth: number, imageHeight: number, cropAspect?: number): CropArea {
  if (cropAspect) {
    const safeAspect = Math.max(0.01, cropAspect);
    let width = Math.max(1, Math.min(Math.round(area.width), imageWidth, Math.round(imageHeight * safeAspect)));
    let height = Math.max(1, Math.round(width / safeAspect));

    if (height > imageHeight) {
      height = imageHeight;
      width = Math.max(1, Math.round(height * safeAspect));
    }

    const x = Math.max(0, Math.min(Math.round(area.x), imageWidth - width));
    const y = Math.max(0, Math.min(Math.round(area.y), imageHeight - height));
    return { x, y, width, height };
  }

  const width = Math.max(1, Math.min(Math.round(area.width), imageWidth));
  const height = Math.max(1, Math.min(Math.round(area.height), imageHeight));
  const x = Math.max(0, Math.min(Math.round(area.x), imageWidth - width));
  const y = Math.max(0, Math.min(Math.round(area.y), imageHeight - height));
  return { x, y, width, height };
}

function formatCropAspect(cropAspect: number): string {
  const ratioPairs: Array<[number, number]> = [[1, 1], [4, 3], [16, 9]];
  const matched = ratioPairs.find(([width, height]) => Math.abs(cropAspect - (width / height)) < 0.01);

  if (matched) {
    return `${matched[0]}:${matched[1]}`;
  }

  return `${cropAspect.toFixed(2)}:1`;
}

async function cropImageFile(file: File, sourceUrl: string, area: CropArea, cropAspect?: number): Promise<File> {
  const image = await loadImage(sourceUrl);
  const crop = clampCropArea(area, image.naturalWidth, image.naturalHeight, cropAspect);
  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('无法读取图片裁剪画布。');
  }

  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error('图片裁剪失败，请重试。')), file.type || 'image/png', 0.92);
  });

  return new File([blob], createCroppedFileName(file.name, blob.type), { type: blob.type, lastModified: Date.now() });
}

function loadImage(sourceUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片读取失败，请换一张图片试试。'));
    image.src = sourceUrl;
  });
}

function createCroppedFileName(name: string, type: string): string {
  const extension = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : type === 'image/gif' ? 'gif' : 'jpg';
  const base = name.replace(/\.[a-z0-9]+$/i, '') || 'image';
  return `${base}-cropped.${extension}`;
}

function ImageCropDialog({ pendingCrop, onConfirm, onKeepOriginal, onCancel }: {
  pendingCrop: PendingCrop | null;
  onConfirm: (area: CropArea) => Promise<void>;
  onKeepOriginal: () => Promise<void>;
  onCancel: () => void;
}) {
  const [area, setArea] = useState<CropArea | null>(null);
  const [saving, setSaving] = useState(false);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; startArea: CropArea } | null>(null);

  useEffect(() => {
    setArea(pendingCrop?.area ?? null);
    setSaving(false);
  }, [pendingCrop]);

  if (!pendingCrop || !area) {
    return null;
  }

  const cropAspect = pendingCrop.cropAspect;
  const aspectLabel = cropAspect ? formatCropAspect(cropAspect) : '';
  const crop = clampCropArea(area, pendingCrop.imageWidth, pendingCrop.imageHeight, cropAspect);
  const maxCropWidth = cropAspect ? Math.min(pendingCrop.imageWidth, Math.round(pendingCrop.imageHeight * cropAspect)) : pendingCrop.imageWidth;
  const updateArea = (patch: Partial<CropArea>) => {
    setArea((current) => current ? clampCropArea({ ...current, ...patch }, pendingCrop.imageWidth, pendingCrop.imageHeight, cropAspect) : current);
  };
  const centerCrop = () => {
    updateArea({
      x: Math.round((pendingCrop.imageWidth - crop.width) / 2),
      y: Math.round((pendingCrop.imageHeight - crop.height) / 2)
    });
  };
  const fillCrop = () => {
    setArea(cropAspect
      ? createAspectCropArea(pendingCrop.imageWidth, pendingCrop.imageHeight, cropAspect, 1)
      : { x: 0, y: 0, width: pendingCrop.imageWidth, height: pendingCrop.imageHeight }
    );
  };
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, startArea: crop };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }
    const frame = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!frame?.width || !frame.height) {
      return;
    }
    const deltaX = ((event.clientX - drag.startX) / frame.width) * pendingCrop.imageWidth;
    const deltaY = ((event.clientY - drag.startY) / frame.height) * pendingCrop.imageHeight;
    setArea(clampCropArea({ ...drag.startArea, x: drag.startArea.x + deltaX, y: drag.startArea.y + deltaY }, pendingCrop.imageWidth, pendingCrop.imageHeight, cropAspect));
  };
  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const confirm = async () => {
    setSaving(true);
    try {
      await onConfirm(crop);
    } finally {
      setSaving(false);
    }
  };
  const keepOriginal = async () => {
    setSaving(true);
    try {
      await onKeepOriginal();
    } finally {
      setSaving(false);
    }
  };
  const cropStyle = {
    left: `${(crop.x / pendingCrop.imageWidth) * 100}%`,
    top: `${(crop.y / pendingCrop.imageHeight) * 100}%`,
    width: `${(crop.width / pendingCrop.imageWidth) * 100}%`,
    height: `${(crop.height / pendingCrop.imageHeight) * 100}%`
  };

  return (
    <div className="admin-crop-dialog" data-crop-dialog role="dialog" aria-modal="true" aria-label="选择图片裁剪范围">
      <div className="admin-crop-panel">
        <header>
          <div>
            <strong>选择图片保留范围</strong>
            <p>拖动亮色框选择要保留的部分，也可以用下面的滑块精确调整。</p>
            {cropAspect ? <p>裁剪框已按要求锁定 {aspectLabel} 比例，你只需要选择保留哪一部分。</p> : null}
          </div>
          <button className="button ghost" type="button" onClick={onCancel} disabled={saving}>取消</button>
        </header>

        <div className="admin-crop-layout">
          <div className="admin-crop-frame">
            <img src={pendingCrop.sourceUrl} alt="" />
            <div
              className="admin-crop-box"
              role="presentation"
              style={cropStyle}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
            >
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="admin-crop-controls">
            <CropSlider label="左右位置" value={crop.x} min={0} max={Math.max(0, pendingCrop.imageWidth - crop.width)} onChange={(x) => updateArea({ x })} />
            <CropSlider label="上下位置" value={crop.y} min={0} max={Math.max(0, pendingCrop.imageHeight - crop.height)} onChange={(y) => updateArea({ y })} />
            {cropAspect ? (
              <CropSlider label="裁剪大小" value={crop.width} min={1} max={maxCropWidth} onChange={(width) => updateArea({ width })} />
            ) : (
              <>
                <CropSlider label="宽度" value={crop.width} min={1} max={pendingCrop.imageWidth} onChange={(width) => updateArea({ width })} />
                <CropSlider label="高度" value={crop.height} min={1} max={pendingCrop.imageHeight} onChange={(height) => updateArea({ height })} />
              </>
            )}
            <div className="admin-crop-presets">
              <button className="button ghost" type="button" onClick={centerCrop} disabled={saving}>居中</button>
              <button className="button ghost" type="button" onClick={fillCrop} disabled={saving}>{cropAspect ? '最大范围' : '整张图'}</button>
            </div>
            <p>{crop.width} x {crop.height}px{cropAspect ? ` · ${aspectLabel}` : ''}</p>
          </div>
        </div>

        <footer>
          <button className="button ghost" type="button" onClick={keepOriginal} disabled={saving}>不裁剪，保留整张</button>
          <button className="button primary" type="button" onClick={confirm} disabled={saving}>{saving ? '处理中' : '使用选中区域'}</button>
        </footer>
      </div>
    </div>
  );
}

function CropSlider({ label, value, min, max, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const roundedMax = Math.max(min, Math.round(max));
  const roundedValue = Math.max(min, Math.min(Math.round(value), roundedMax));

  return (
    <label className="admin-crop-slider">
      <span>{label}</span>
      <input type="range" min={min} max={roundedMax} value={roundedValue} onChange={(event) => onChange(Number(event.target.value))} />
      <small>{roundedValue}px</small>
    </label>
  );
}

export function ImageUploadField({ label, value, onChange, uploadImage, cropAspect }: {
  label: string;
  value: unknown;
  onChange: (value: string) => void;
  uploadImage: UploadImage;
  cropAspect?: number;
}) {
  const currentPath = stringValue(value);
  const cropFlow = useImageUploadFlow(uploadImage, (savedPath) => onChange(savedPath), cropAspect);

  return (
    <div className="admin-field admin-field-wide admin-image-uploader">
      <span>{label}</span>
      <div className="admin-image-field">
        <figure className="admin-image-preview">
          {cropFlow.preview || currentPath ? <img src={cropFlow.preview || currentPath} alt="" loading="lazy" /> : <div>暂无图片</div>}
          <figcaption>{cropFlow.preview ? '已按你选择的范围裁剪并上传，路径会自动回填' : currentPath || '选择本地图片或填写图片地址'}</figcaption>
        </figure>
        <div className="admin-image-controls">
          <input value={currentPath} placeholder="/assets/uploads/cover.jpg" onChange={(event) => onChange(event.target.value)} />
          <label className="button ghost admin-file-button">
            上传本地图片
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={cropFlow.handleFile} />
          </label>
        </div>
      </div>
      <ImageCropDialog pendingCrop={cropFlow.pendingCrop} onConfirm={cropFlow.confirmCrop} onKeepOriginal={cropFlow.keepOriginal} onCancel={cropFlow.cancelCrop} />
      <FieldHelp text="字段说明：上传后可以先选择要保留的画面范围，再自动把图片地址填到这里。" />
    </div>
  );
}

export function ImageListEditor({ label, value, onChange, uploadImage, cropAspect }: {
  label: string;
  value: unknown;
  onChange: (value: string[]) => void;
  uploadImage: UploadImage;
  cropAspect?: number;
}) {
  const images = Array.isArray(value) ? value.map((item) => stringValue(item)).filter(Boolean) : [];
  const replaceImage = (index: number, nextPath: string) => onChange(images.map((item, itemIndex) => itemIndex === index ? nextPath : item));
  const removeImage = (index: number) => onChange(images.filter((_item, itemIndex) => itemIndex !== index));
  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) {
      return;
    }
    const next = [...images];
    const current = next[index];
    next[index] = next[target];
    next[target] = current;
    onChange(next);
  };
  const appendCropFlow = useImageUploadFlow(uploadImage, (savedPath) => onChange([...images, savedPath]), cropAspect);

  return (
    <div className="admin-field admin-field-wide admin-image-list">
      <span>{label}</span>
      <div className="admin-image-list-actions">
        <button className="button ghost" type="button" onClick={() => onChange([...images, ''])}>手动添加图片地址</button>
        <label className="button ghost admin-file-button">
          上传本地图片
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={appendCropFlow.handleFile} />
        </label>
      </div>
      <ImageCropDialog pendingCrop={appendCropFlow.pendingCrop} onConfirm={appendCropFlow.confirmCrop} onKeepOriginal={appendCropFlow.keepOriginal} onCancel={appendCropFlow.cancelCrop} />
      {images.length > 0 ? (
        <div className="admin-image-list-items">
          {images.map((image, index) => (
            <div className="admin-image-list-item" key={`${image}-${index}`}>
              <ImageUploadField label={`图片 ${index + 1}`} value={image} onChange={(nextPath) => replaceImage(index, nextPath)} uploadImage={uploadImage} cropAspect={cropAspect} />
              <div className="admin-row-actions">
                <button className="button ghost" type="button" onClick={() => moveImage(index, -1)}>上移</button>
                <button className="button ghost" type="button" onClick={() => moveImage(index, 1)}>下移</button>
                <button className="button danger" type="button" onClick={() => removeImage(index)}>移除</button>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="admin-help-text">还没有图片，可以上传本地图片来新增。</p>}
      <FieldHelp text="字段说明：可以放多张图片，拖不动时用上移、下移调整顺序。" />
    </div>
  );
}

function GalleryItemsEditor({ label, value, onChange, uploadImage, cropAspect }: {
  label: string;
  value: unknown;
  onChange: (value: JsonRecord[]) => void;
  uploadImage: UploadImage;
  cropAspect?: number;
}) {
  const items = asRecordArray(value);
  const replaceItem = (index: number, patch: JsonRecord) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const addItem = () => onChange([...items, { title: '新子图', image: '/assets/img/hero-mountain.svg', alt: '' }]);
  const removeItem = (index: number) => onChange(items.filter((_item, itemIndex) => itemIndex !== index));

  return (
    <div className="admin-field admin-field-wide admin-gallery-items">
      <span>{label}</span>
      <button className="button ghost" type="button" onClick={addItem}>添加一张子图</button>
      {items.map((item, index) => (
        <div className="admin-gallery-item" key={`${item.image ?? index}-${index}`}>
          <label className="admin-field">
            <span>子图标题</span>
            <input value={stringValue(item.title)} onChange={(event) => replaceItem(index, { title: event.target.value })} />
          </label>
          <label className="admin-field">
            <span>图片说明</span>
            <input value={stringValue(item.alt)} onChange={(event) => replaceItem(index, { alt: event.target.value })} />
          </label>
          <ImageUploadField label="子图图片" value={item.image} onChange={(nextPath) => replaceItem(index, { image: nextPath })} uploadImage={uploadImage} cropAspect={cropAspect} />
          <div className="admin-row-actions">
            <button className="button danger" type="button" onClick={() => removeItem(index)}>移除子图</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function FieldHelp({ text, fallback = '' }: { text?: string; fallback?: string }) {
  const content = text || fallback;

  if (!content) {
    return null;
  }

  return <small className="admin-field-help">字段说明：{content}</small>;
}

function plainTextFromStoredContent(value: unknown): string {
  const text = stringValue(value);
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`~]/g, '');
}
