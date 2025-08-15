import React from 'react';
import { useParams } from 'react-router-dom';
import OutlineView from '@/components/OutlineView';

const OutlinePage: React.FC = () => {
  const { outlineId } = useParams<{ outlineId?: string }>();

  return <OutlineView {...(outlineId ? { outlineId } : {})} />;
};

export default OutlinePage;