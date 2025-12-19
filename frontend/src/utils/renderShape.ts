const ERASER_SCREEN_SIZE = 30;


const renderShape = (shape: any, extraProps: any = {}) => {
  const hitWidth = Math.max(
    shape.strokeWidth || 2,
    ERASER_SCREEN_SIZE / viewport.scale
  );

  const finalStroke = getDisplayColor(shape.strokeColor || "black", theme);
  const finalFill = shape.fill === "transparent"
    ? "transparent"
    : getDisplayColor(shape.fill, theme);

  const isSelected = selectedIds.has(shape.id);

  const handleTransformEnd = (e: any) => {
    if (!yjsShapesMap) return;
    const node = e.target;

    const baseAttrs = {
      ...shape,
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
    };

    if (shape.type === 'line' || shape.points) {
      yjsShapesMap.set(shape.id, {
        ...baseAttrs,
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
      });
    }

    else if (shape.type === 'text') {
      handleTextTransformEnd(node, shape)
    }

    else {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      node.scaleX(1);
      node.scaleY(1);

      yjsShapesMap.set(shape.id, {
        ...baseAttrs,
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        scaleX: 1,
        scaleY: 1,
      });
    }
  };

  const handleDragEnd = (e: any) => {
    if (!yjsShapesMap) return;
    yjsShapesMap.set(shape.id, {
      ...shape,
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const commonProps = {
    id: shape.id,
    x: shape.x || 0,
    y: shape.y || 0,
    name: "whiteboard-object",
    rotation: shape.rotation || 0,
    scaleX: shape.scaleX || 1,
    scaleY: shape.scaleY || 1,
    stroke: finalStroke || "black",
    strokeWidth: shape.strokeWidth || 2,
    hitStrokeWidth: hitWidth,
    lineCap: "round" as const,
    lineJoin: "round" as const,
    listening: true,
    draggable: tool === 'select' && isSelected,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
    ...extraProps
  };

  if (shape.type === 'text') {
    const isEditing = editingId === shape.id;
    const currentZoom = viewport.scale;
    const konvaFontStyle = `${shape.fontWeight || 'normal'} ${shape.fontStyle || 'normal'}`;

    return (
      <React.Fragment key={shape.id}>
        <KonvaText
          {...commonProps}
          strokeEnabled={false}
          text={shape.text || "\u200b"}
          fill={finalFill}
          fontStyle={konvaFontStyle}
          textDecoration={shape.textDecoration}
          fontSize={(shape.fontSize || 24) * currentZoom}
          width={shape.width * currentZoom}
          scaleX={1 / currentZoom}
          scaleY={1 / currentZoom}
          onTransform={handleTextTransform}
          fontFamily={shape.fontFamily || "sans-serif"}
          opacity={isEditing ? 0 : 1}
          onDblClick={() => setEditingId(shape.id)}
        />

        {isEditing && (
          <TextEditor
            shape={{ ...shape, fill: finalFill }}
            scale={currentZoom}
            onAttributesChange={handleAttributeChange}
            onChange={handleTextChange}
            onFinish={handleFinish}
          />
        )}
      </React.Fragment>
    );
  }

  if (shape.type === 'rect') {
    return (
      <Rect
        key={shape.id || 'temp'}
        {...commonProps}
        width={shape.width}
        height={shape.height}
        fill={finalFill || "transparent"}
        dash={getDashArray(shape.strokeType, shape.strokeWidth)}
        cornerRadius={shape.strokeType === 'wobbly' ? 10 : 0}
      />
    );
  }
  if (shape.strokeType === 'wobbly' && shape.points) {
    return (
      <WobblyLine
        key={shape.id || 'temp'}
        {...commonProps}
        points={shape.points || []}
        color={finalStroke || "black"}
        width={shape.strokeWidth || 2}
      />
    );
  }

  if (shape.points) {
    return (
      <Line
        key={shape.id || 'temp'}
        {...commonProps}
        points={shape.points || []}
        dash={getDashArray(shape.strokeType, shape.strokeWidth)}
        tension={0.5}
      />
    );
  }
  return null;
};
