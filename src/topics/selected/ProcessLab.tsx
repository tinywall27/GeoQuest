import { useParams } from 'react-router-dom';
import SelectedLab from './SelectedLab';
import { processLabs } from './process';
export default function ProcessLab() {
 const {slug} = useParams();
 const lab = processLabs.find(l => l.slug === slug);
 return lab ? <SelectedLab key={lab.slug} lab={lab}/> : <p>主题不存在。</p>;
}
