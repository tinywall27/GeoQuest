import { useParams } from 'react-router-dom';
import SelectedLab from './SelectedLab';
import { decisionLabs } from './decisions';
export default function DecisionLab() {
 const {slug} = useParams();
 const lab = decisionLabs.find(l => l.slug === slug);
 return lab ? <SelectedLab key={lab.slug} lab={lab}/> : <p>主题不存在。</p>;
}
