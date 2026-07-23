import { describe, expect, it } from 'vitest';
import { calculateDecisionInsights } from '../utils/insightMetrics';
import { Opportunity } from '../types';
const open: Opportunity = { id:'one', title:'AI Fellowship', organization:'HEC', category:'Scholarship', deadline:'2026-12-31', location:'Remote', stipendOrPrize:'Funded', techStackOrEligibility:['Python'], description:'A detailed opportunity description for testing.', applyUrl:'https://hec.gov.pk/apply', postedDate:'2026-07-01', trustTier:'tier-1-official' };
const expired: Opportunity = { ...open, id:'two', title:'Old event', deadline:'2024-01-01' };
describe('decision insight metrics', () => {
  it('excludes expired items from the action queue and reports urgency', () => { const result=calculateDecisionInsights([open,expired],{one:{opportunityId:'one',score:90,verdict:'Excellent Match',matchingSkills:[],missingSkills:[],reasons:[]},two:{opportunityId:'two',score:90,verdict:'Excellent Match',matchingSkills:[],missingSkills:[],reasons:[]}},['one']); expect(result.urgency.overdue).toBe(1); expect(result.highPriorityQueue).toHaveLength(1); });
  it('returns safe zero values for an empty radar', () => { const result=calculateDecisionInsights([],{},[]); expect(result.conversion.conversionRate).toBe(0); expect(result.pipeline.every(item=>item.count===0)).toBe(true); });
});
