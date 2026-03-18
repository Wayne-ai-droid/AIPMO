import React from 'react';
import { useParams } from 'react-router-dom';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div>
      <h1>项目详情 - #{id}</h1>
      <p>项目详情功能开发中...</p>
    </div>
  );
};

export default ProjectDetail;
