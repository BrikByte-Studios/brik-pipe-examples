package com.brikbyte.example;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

import com.brikbyte.example.controller.RootAndPaymentsController;

public class HealthControllerTest {

    @Test
    void healthEndpointReturnsOK() {
        RootAndPaymentsController controller = new RootAndPaymentsController();
        assertThat(controller.health().get("status")).isEqualTo("ok");
    }
}
