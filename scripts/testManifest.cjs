const rootScriptTests = [
	'bootstrapEnvironment.test.cjs',
	'checkEntitlementPackageVersion.test.cjs',
	'environmentContract.test.cjs',
	'firebaseDeploymentSafety.test.cjs',
	'frontendBuildProfile.test.cjs',
	'generatePullRequestSummary.test.cjs',
	'generateReleaseNotes.test.cjs',
	'maintenanceHistoryAdapterBoundary.test.cjs',
	'maintenanceHistoryInventoryCore.test.cjs',
	'maintenanceHistoryWriteContainment.test.cjs',
	'organizeLocalEnvironment.test.cjs',
	'propertyTaxonomyMigrationCore.test.cjs',
	'syncAdrImplementationTrackers.test.cjs',
	'syncEntitlementPackageLocks.test.cjs',
	'syncGitHubEnvironment.test.cjs',
	'taskSpaceMigrationCore.test.cjs',
	'testManifest.test.cjs',
	'validateDeployedWebRoutes.test.cjs',
	'workflowChangeClassification.test.cjs',
	'workflowPolicy.test.cjs',
];

const functionTests = [
	'accessLifecycleBilling.test.cjs',
	'activatePropertySetupMaintenancePlan.test.cjs',
	'complimentaryAccessCodes.test.cjs',
	'docxServiceReport.test.cjs',
	'grantAwareCheckout.test.cjs',
	'legacyMaintenancePromotion.test.cjs',
	'manageManualOccupancy.test.cjs',
	'manageRecurringTask.test.cjs',
	'pdfDocumentExtraction.test.cjs',
	'personalAssistantCredentialCore.test.cjs',
	'propertyKnowledgeAcquisitionEligibility.test.cjs',
	'propertyKnowledgeLinks.test.cjs',
	'stripeBillingDisclosure.test.cjs',
	'stripeSubscriptionSelection.test.cjs',
];

module.exports = {
	functionTests,
	rootScriptTests,
};
