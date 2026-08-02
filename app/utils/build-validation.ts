import type { Builds } from '~/types/build';
import type { RuleItem } from '~/types/rules';

export function createRule<TParts extends Builds.PartType>(params: RuleItem<TParts>) {
	return params;
}

export function createIssue(
	severity: Builds.BuildIssue['severity'],
	code: string,
	message: string,
	parts: Builds.PartType[],
): Builds.BuildIssue {
	return { severity, code, message, parts };
}
