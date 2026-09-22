import { useParams } from 'react-router-dom';
import SelectedLab from './SelectedLab';
import { readingLabs } from './reading';
export default function ReadingLab() {
 const {slug} = useParams();
 const lab = readingLabs.find(l => l.slug === slug);
 return lab ? <SelectedLab key={lab.slug} lab={lab}/> : <p>主题不存在。</p>;
}
