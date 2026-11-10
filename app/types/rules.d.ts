import type { Builds } from './build';

export interface RuleProps<TParts extends Builds.PartType> {
	build: Partial<Builds.ResolvedParts> & Pick<Required<Builds.ResolvedParts>, TParts>;
	issue: (severity: Issue['severity'], code: string, message: string) => Builds.BuildIssue;
}

export interface RuleItem<TParts extends Builds.PartType> {
	parts: TParts[];
	rule: (params: RuleProps<TParts>) => Builds.BuildIssue | void;
}
