describe('Admin Workflow', () => {
    const adminEmail = 'admin@admin.com';
    const adminPassword = 'password';
    const timestamp = Date.now();
    const categoryNameEn = `TestCat ${timestamp}`;
    const tagNameEn = `TestTag ${timestamp}`;

    beforeEach(() => {
        cy.login(adminEmail, adminPassword);
    });

    it('should log in and see the dashboard with admin navigation', () => {
        cy.visit('/');
        // Admin should see Upload, Users, Categories links in nav
        cy.get('nav').should('be.visible');
        cy.get('nav a[href="/upload"]').should('be.visible');
        cy.get('nav a[href="/users"]').should('be.visible');
        cy.get('nav a[href="/categories"]').should('be.visible');
    });

    it('should create a new category', () => {
        cy.visit('/categories');
        cy.url().should('include', '/categories');

        // Click the "Add" button (first button in the flex header)
        cy.get('.container button.bg-blue-600').first().click();

        // The modal should appear with the form
        cy.get('.fixed').should('be.visible');

        // Fill in the EN name input (first text input in the modal form)
        cy.get('.fixed form input[type="text"]').first().clear().type(categoryNameEn);

        // Submit the form via the submit button (blue button in the form)
        cy.get('.fixed form button[type="submit"]').click();

        // Modal should close and category should appear
        cy.contains(categoryNameEn).should('be.visible');
    });

    it('should create a new tag', () => {
        cy.visit('/tags');
        cy.url().should('include', '/tags');

        // Click "Add Tag" button
        cy.get('.container button.bg-blue-600').first().click();

        // Modal should appear
        cy.get('.fixed').should('be.visible');

        // Fill in the EN name (first input in the modal)
        cy.get('.fixed input').first().clear().type(tagNameEn);

        // Click Save button in the modal
        cy.get('.fixed button.bg-blue-600').click();

        // Tag should appear in the list
        cy.contains(tagNameEn).should('be.visible');
    });

    it('should browse the users list and see multiple users', () => {
        cy.visit('/users');
        cy.url().should('include', '/users');

        // Should have a table with users
        cy.get('table').should('be.visible');
        cy.get('table tbody tr').should('have.length.greaterThan', 0);

        // Admin email should be visible
        cy.contains('td', adminEmail).should('be.visible');
    });

    it('should edit a non-admin user password', () => {
        cy.visit('/users');

        // Find a row that is NOT the admin and click its Edit link
        cy.get('table tbody tr').each(($row) => {
            const text = $row.text();
            if (!text.includes(adminEmail)) {
                cy.wrap($row).find('a').contains('Edit').click();
                return false; // break the each loop
            }
        });

        // Should be on edit page
        cy.url().should('include', '/edit');

        // Type a new password
        cy.get('input[placeholder="New Password"]').clear().type('newpassword123');

        // Save
        cy.get('form button[type="submit"]').click();

        // Should get an alert and redirect
        cy.on('window:alert', (str) => {
            expect(str).to.exist;
        });
    });
});
