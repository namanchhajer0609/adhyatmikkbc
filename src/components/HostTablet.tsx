import React from 'react';
import { useGame } from '../context/GameContext';
import { PRIZE_LADDER, formatSamvarPoints } from '../game/rules';
import { AudiencePollBar } from './AudiencePollBar';
import { Mic, ShieldCheck, Sparkles, CircleHelp, Users, Award } from 'lucide-react';

export const HostTablet: React.FC = () => {
  const { state } = useGame();
  const currentLevel = state?.currentLadderLevel || 1;
  const currentPrize = PRIZE_LADDER.find((p) => p.level === currentLevel);
  const activeQ = state?.activeQuestion;
  const contestant = state?.hotSeatContestant;
  const getHostCue = () => {
    switch (state?.stage) {
      case 'REGISTRATION': return 'Welcome everyone and invite them to scan the code on the main screen to join the arena.';
      case 'FFF_INTRO':
      case 'FFF_ACTIVE': return 'Explain the order challenge. Ask everyone to arrange the four items, then submit as quickly as they can.';
      case 'FFF_WINNER': return `Celebrate ${state.fffWinner?.name || 'the winner'} and invite them to take the Hot Seat.`;
      case 'HOT_SEAT_INTRO': return `Welcome ${contestant?.name || 'the contestant'} to the Hot Seat. Explain the safety milestones and available lifelines.`;
      case 'QUESTION_ACTIVE':
        if (state.lifelines.audiencePoll.active) return 'The audience poll is live. Invite everyone to vote on their phones.';
        if (state.lifelines.askMaharaj.active) return 'The contestant has asked for guidance. Invite the Maharaj to share their wisdom.';
        if (state.selectedOption) return `Option ${state.selectedOption} is selected. Ask the contestant if they are ready to lock it in.`;
        return `Read Question ${currentLevel} clearly and give the contestant a moment to think.`;
      case 'ANSWER_LOCKED': return `Option ${state.selectedOption} is locked. Build a little suspense before the reveal.`;
      case 'ANSWER_REVEALED': return state.isAnswerCorrect ? `That is correct! Celebrate ${contestant?.name || 'the contestant'} and their ${currentPrize?.displayPoints} milestone.` : `That is not correct. Acknowledge the contestant warmly; they leave with ${state.lastSecuredMilestone ? formatSamvarPoints(state.lastSecuredMilestone) : '0 points'}.`;
      case 'CONTESTANT_QUIT': return `${contestant?.name || 'The contestant'} is walking away with ${contestant ? formatSamvarPoints(contestant.pointsWon) : '0 points'}. Congratulate them on their journey.`;
      case 'GAME_COMPLETED': return 'A wonderful finish! Lead the room in celebrating the 7 Crore Samvar Points win.';
      default: return 'Follow the show as it unfolds on the main display.';
    }
  };
  const stageLabel = (state?.stage || 'REGISTRATION').replaceAll('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
  return <div className="host-screen">
    <header className="host-topbar"><div className="host-brand"><span><Mic size={18}/></span><div><b>Presenter view</b><small>Adhyatmik KBC · Stage companion</small></div></div><div className="host-stage"><i/>{stageLabel}</div></header>
    <main className="host-layout">
      <section className="host-primary">
        <div className="host-cue"><div className="host-cue-label"><Sparkles size={15}/> YOUR NEXT CUE <span>LIVE</span></div><p>{getHostCue()}</p></div>
        {activeQ ? <article className="host-question"><div className="host-question-meta"><span>QUESTION {activeQ.ladderLevel} <i>·</i> {activeQ.category}</span><span>{activeQ.difficulty}</span></div><h2>{activeQ.question}</h2><div className="host-answers">{activeQ.options.map(opt=>{const selected=state?.selectedOption===opt.id;const hidden=state?.lifelines.fiftyFifty.active&&state.lifelines.fiftyFifty.hiddenOptions.includes(opt.id);return <div key={opt.id} className={`host-answer ${selected?'selected':''} ${hidden?'hidden':''}`}><b>{opt.id}</b><span>{opt.text}</span>{selected&&<small>SELECTED</small>}</div>})}</div>{state?.activeQuestionRevealed&&activeQ.explanation&&<div className="host-explanation"><b>THE WISDOM BEHIND IT</b><p>{activeQ.explanation}</p>{activeQ.supportingReference&&<small>{activeQ.supportingReference}</small>}</div>}</article> : <div className="host-wait"><div><Mic size={21}/></div><b>Between questions</b><span>Your stage cue will update with the next moment in the show.</span></div>}
        {state?.lifelines.audiencePoll.active&&<AudiencePollBar percentages={state.lifelines.audiencePoll.percentages} totalVotes={state.lifelines.audiencePoll.totalVotes} secondsRemaining={state.lifelines.audiencePoll.secondsRemaining} isActive={true}/>}
      </section>
      <aside className="host-sidebar"><div className="host-profile"><span className="host-profile-icon">{contestant?<Award size={19}/>:<Users size={19}/>}</span><small>IN THE HOT SEAT</small><b>{contestant?.name||'Awaiting first contestant'}</b><span>{contestant?`${formatSamvarPoints(contestant.pointsWon)} secured`:'The room is ready to begin'}</span></div><div className="host-stats"><div><small>QUESTION</small><b>Q{currentLevel}<span> / 11</span></b><em>{currentPrize?.displayPoints}</em></div><div><small>SAFE POINTS</small><b className="safe-points"><ShieldCheck size={15}/>{state?.lastSecuredMilestone?formatSamvarPoints(state.lastSecuredMilestone):'Not secured yet'}</b></div></div><div className="host-lifelines"><div className="host-side-title"><CircleHelp size={15}/> LIFELINES</div>{[['50:50',state?.lifelines.fiftyFifty.used],['Ask the Maharaj',state?.lifelines.askMaharaj.used],['Audience poll',state?.lifelines.audiencePoll.used]].map(([name,used])=><div className={`host-life ${used?'used':''}`} key={String(name)}><span>{String(name)}</span><b>{used?'USED':'READY'}</b></div>)}</div><div className="host-tip"><b>Presenter note</b><p>Keep your attention on the contestant. The audience display carries the question and choices.</p></div></aside>
    </main>
  </div>;
};
