package com.texttutor;

import org.junit.platform.launcher.Launcher;
import org.junit.platform.launcher.LauncherDiscoveryRequest;
import org.junit.platform.launcher.core.LauncherDiscoveryRequestBuilder;
import org.junit.platform.launcher.core.LauncherFactory;
import org.junit.platform.launcher.listeners.SummaryGeneratingListener;
import org.junit.platform.launcher.listeners.TestExecutionSummary;

import static org.junit.platform.engine.discovery.DiscoverySelectors.selectClass;

public class TestRunner {
    public static void main(String[] args) {
        System.out.println("=== Starting TextTutor Automated Test Suite ===");
        LauncherDiscoveryRequest request = LauncherDiscoveryRequestBuilder.request()
                .selectors(selectClass(TextTutorApplicationTests.class))
                .build();

        Launcher launcher = LauncherFactory.create();
        SummaryGeneratingListener listener = new SummaryGeneratingListener();
        launcher.registerTestExecutionListeners(listener);

        launcher.execute(request);

        TestExecutionSummary summary = listener.getSummary();
        System.out.println("\n==========================================");
        System.out.println("        TEST EXECUTION SUMMARY");
        System.out.println("==========================================");
        System.out.println("Tests started:    " + summary.getTestsStartedCount());
        System.out.println("Tests succeeded:  " + summary.getTestsSucceededCount());
        System.out.println("Tests failed:     " + summary.getTestsFailedCount());
        System.out.println("Tests skipped:    " + summary.getTestsSkippedCount());
        System.out.println("==========================================");

        if (summary.getTestsFailedCount() > 0) {
            System.err.println("\nFailures:");
            summary.getFailures().forEach(failure -> {
                System.err.println("Test: " + failure.getTestIdentifier().getDisplayName());
                failure.getException().printStackTrace();
            });
            System.exit(1);
        } else {
            System.out.println("\n>>> ALL " + summary.getTestsSucceededCount() + " AUTOMATED TESTS PASSED SUCCESSFULLY! <<<");
            System.exit(0);
        }
    }
}
