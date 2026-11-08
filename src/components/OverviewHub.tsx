import React, { useState } from 'react';
import { ExtendedDisplayGuide } from './ExtendedDisplayGuide';
import { Monitor, Tv, Mic, Tablet, Smartphone, Sparkles, ArrowUpRight, Users, ShieldCheck, CircleHelp } from 'lucide-react';
import { PRIZE_LADDER } from '../game/rules';

const roles = [
  { number: '01', title: 'Run the show', name: 'Operator console', path: '/admin', detail: 'Manage questions, timing, lifelines and contestant flow.', device: 'Laptop', icon: Monitor, tone: 'gold' },
  { number: '02', title: 'Share with the room', name: 'Audience display', path: '/projector', detail: 'The live stage view for the projector or large screen.', device: 'Projector', icon: Tv, tone: 'mint' },
  { number: '03', title: 'Guide the moment', name: 'Presenter view', path: '/host', detail: 'Keep cues, contestant details and poll results close at hand.', device: 'Host tablet', icon: Mic, tone: 'blue' },
  { number: '04', title: 'Take the hot seat', name: 'Contestant view', path: '/contestant', detail: 'Choose, review and lock an answer with clear touch controls.', device: 'Contestant tablet', icon: Tablet, tone: 'gold' },
  { number: '05', title: 'Bring everyone in', name: 'Audience join', path: '/join', detail: 'Let participants join the room, play Fastest Finger First and vote.', device: 'Phone', icon: Smartphone, tone: 'violet' },
];

export const OverviewHub: React.FC = () => {
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  return (
    <div className="hub-page">
      <header className="hub-nav">
        <a href="/" className="hub-brand"><span className="hub-mark">ॐ</span><span>ADHYATMIK <b>KBC</b></span></a>
        <div className="hub-nav-right"><span className="hub-live"><i /> Ready for your next gathering</span><button className="hub-help" onClick={() => setShowSetupGuide(true)}><CircleHelp size={16}/> Setup guide</button></div>
      </header>
      <main className="hub-main">
        <section className="hub-hero">
          <div className="hub-hero-copy">
            <div className="hub-eyebrow"><Sparkles size={14}/> A QUIZ OF WISDOM & WONDER</div>
            <h1>Make every answer<br/><em>a moment.</em></h1>
            <p>One connected stage for a shared journey through spiritual knowledge. Choose a screen to get started.</p>
            <div className="hub-hero-actions"><a className="hub-primary" href="/admin"><ShieldCheck size={17}/> Open show controls <ArrowUpRight size={16}/></a><button className="hub-secondary" onClick={() => setShowSetupGuide(true)}><Tv size={16}/> Connect a display</button></div>
          </div>
          <div className="hub-orbit" aria-hidden="true"><div className="orbit-ring ring-one"/><div className="orbit-ring ring-two"/><div className="orbit-center">ॐ</div><span className="orbit-dot dot-a"/><span className="orbit-dot dot-b"/><span className="orbit-dot dot-c"/><span className="orbit-caption">A SHARED SPACE<br/>FOR KNOWLEDGE</span></div>
          <div className="hub-hero-foot"><span><b>01</b> Host-led and audience-powered</span><span className="foot-divider"/><span>Designed for one room, many screens</span></div>
        </section>
        <section className="hub-roles">
          <div className="section-heading"><div><span className="section-kicker">YOUR SHOW, AT A GLANCE</span><h2>Choose your view</h2></div><span className="section-note">Each screen stays in sync as the game unfolds.</span></div>
          <div className="role-grid">{roles.map(({number,title,name,path,detail,device,icon:Icon,tone})=><a href={path} key={path} className={`role-card tone-${tone}`}><div className="role-card-top"><span className="role-icon"><Icon size={19}/></span><span className="role-number">{number}</span></div><span className="role-overline">{title}</span><h3>{name}</h3><p>{detail}</p><div className="role-card-foot"><span>{device}</span><span className="role-arrow"><ArrowUpRight size={17}/></span></div></a>)}</div>
        </section>
        <section className="hub-ladder"><div className="ladder-heading"><div><span className="section-kicker">THE JOURNEY</span><h2>11 steps. One big moment.</h2></div><p>Climb the Samvar Points ladder, with milestones to celebrate along the way.</p></div><div className="ladder-track">{PRIZE_LADDER.map(step=><div key={step.level} className={`ladder-step ${step.isGuaranteed?'is-milestone':''} ${step.level===11?'is-top':''}`}><span className="step-level">Q{step.level}</span><strong>{step.displayPoints}</strong>{step.isGuaranteed&&<span className="step-tag">MILESTONE</span>}</div>)}</div><div className="ladder-foot"><span><i className="legend-dot"/> Guaranteed milestones</span><span>Top prize <b>7 Crore Samvar Points</b></span></div></section>
        <footer className="hub-footer"><span>ADHYATMIK KBC <small>· A thoughtful game, shared together</small></span><button onClick={() => setShowSetupGuide(true)}>Display setup <ArrowUpRight size={14}/></button></footer>
      </main>
      <ExtendedDisplayGuide isOpen={showSetupGuide} onClose={() => setShowSetupGuide(false)} />
    </div>
  );
};
